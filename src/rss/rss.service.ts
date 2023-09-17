import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { rss, Prisma } from "@prisma/client";
import { chatid, delay } from "../util/config";
import Parser from "rss-parser";
import { getFeedData } from "../util/axios";
import { TelegramService } from "../telegram/telegram.service";
import { CustomLoggerService } from "../logger/logger.service";
import uniqueItems from "../util/uniqueItems";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import constants from "src/util/constants";
import { StatisticService } from "src/statistic/statistic.service";
import { getLogger } from "src/winston";
import { DateTime } from "luxon";

const winston = getLogger();

let parser = new Parser();
@Injectable()
export class RssService implements OnModuleInit {
  constructor(
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue,
    @InjectQueue(constants.queue.repeatableFeed)
    private repeatableFeedQueue: Queue,
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private statisticService: StatisticService,
    private logger: CustomLoggerService
  ) {
    this.logger.setContext("RssService");
    winston.debug("DELAY: " + delay + " seconds");
  }

  async onModuleInit() {
    await this.migrateToMultiChat();
    await this.syncRepeatableJobs();
    await this.messagesQueue.resume();
  }

  every = 300000;

  getJobId = (feed: rss) => {
    return `feed=${feed.id}&chat_id=${feed.chat_id}`;
  };

  async syncRepeatableJobs() {
    let repeatableJobs = await this.repeatableFeedQueue.getRepeatableJobs();

    const feeds = await this.feeds({ where: { disabled: false } });

    const wantedFeeds = feeds.map((feed) => ({
      ...feed,
      key: this.getJobId(feed)
    }));

    const checkedJobs: Parser.Item & { key: string }[] = [];

    // check if existing jobs have unwanted extra job
    for (const existingJob of repeatableJobs) {
      const isUnwantedJob = !wantedFeeds.some((wantedJob) => {
        return existingJob.key.includes(wantedJob.key);
      });

      if (isUnwantedJob) {
        this.logger.debug("Removed " + existingJob.key);
        await this.repeatableFeedQueue.removeRepeatableByKey(existingJob.key);
      } else {
        checkedJobs.push(existingJob);
      }
    }

    // check if wanted jobs are missing
    for (const wantedFeed of wantedFeeds) {
      const isMissingJob = !checkedJobs.some((job) =>
        job.key.includes(wantedFeed.key)
      );

      if (isMissingJob) {
        this.logger.debug(`Adding missing ${wantedFeed.key}`);
        await this.addRepeatableFeedJob(wantedFeed);
      }
    }
  }

  async addRepeatableFeedJob(rss: rss) {
    await this.repeatableFeedQueue.add(
      "feed",
      { ...rss },
      {
        jobId: this.getJobId(rss),
        repeat: { every: this.every },
        removeOnComplete: true,
        removeOnFail: true
      }
    );
  }

  async feed(
    userWhereUniqueInput: Prisma.rssWhereUniqueInput
  ): Promise<rss | null> {
    return this.prisma.rss.findUnique({
      where: userWhereUniqueInput
    });
  }

  async feeds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.rssWhereUniqueInput;
    where?: Prisma.rssWhereInput;
    orderBy?: Prisma.rssOrderByWithRelationInput;
  }): Promise<rss[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.rss.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    });
  }

  async findFirst(params: { where?: Prisma.rssWhereInput }) {
    return await this.prisma.rss.findFirst(params);
  }

  async createFeed(data: Prisma.rssCreateInput): Promise<rss> {
    return this.prisma.rss.create({
      data
    });
  }

  async updateFeed(params: {
    where: Prisma.rssWhereUniqueInput;
    data: Prisma.rssUpdateInput;
  }): Promise<rss> {
    const { where, data } = params;
    const result = await this.prisma.rss.update({
      data,
      where
    });
    await this.syncRepeatableJobs();
    return result;
  }

  async deleteFeed(chatId: number, name: string): Promise<rss> {
    const result = await this.prisma.rss.findFirst({
      where: {
        chat_id: chatId,
        name: name
      }
    });

    if (result) {
      const deletedFeed = await this.prisma.rss.delete({
        where: { id: result.id }
      });
      await this.syncRepeatableJobs();
      return deletedFeed;
    }
  }

  async migrateChat(dto: { chatId: number; newChatId: number }) {
    await this.prisma.rss.updateMany({
      where: { chat_id: dto.chatId },
      data: { chat_id: dto.newChatId }
    });
  }

  async disableAllFeeds(dto: { chatId: number; disable: boolean }) {
    await this.prisma.rss.updateMany({
      where: { chat_id: dto.chatId },
      data: { disabled: dto.disable }
    });

    const activeJobs = await this.messagesQueue.getJobs(["waiting", "delayed"]);

    for (const job of activeJobs) {
      if (job.data.chatId === dto.chatId) {
        job.remove();
      }
    }
    await this.syncRepeatableJobs();
  }

  async disableFeed(dto: { name: string; disable: boolean; chatId: number }) {
    await this.prisma.rss.updateMany({
      where: { name: dto.name, chat_id: dto.chatId },
      data: { disabled: dto.disable, failures: JSON.stringify([]) }
    });
    await this.syncRepeatableJobs();
  }

  async processFeedJob(rss: rss) {
    const isDevChat = rss.chat_id === parseInt(process.env.DEV_CHAT);
    try {
      let feedReq = await getFeedData(rss.link);

      // @ts-ignore
      let feed = await parser.parseString(feedReq);

      // workaround for double msges
      rss = (
        await this.feeds({
          where: { id: rss.id }
        })
      )[0];

      const feedItems = feed.items;

      const lastItem = feedItems[0];
      if (isDevChat) {
        winston.debug("feedItems: " + JSON.stringify(feedItems), {
          labels: { chat_id: rss.chat_id }
        });
      }
      winston.debug(`-------checking feed: ${rss.name}---------- `, {
        labels: { chat_id: rss.chat_id }
      });
      winston.debug("last: " + lastItem.link, {
        labels: { chat_id: rss.chat_id }
      });
      if (lastItem.link !== rss.last) {
        if (isDevChat) {
          winston.debug("current feed last:" + rss.last, {
            labels: { chat_id: rss.chat_id }
          });
        }
        const findSavedItemIndex =
          feedItems.findIndex((item) => item.link === rss.last) !== -1
            ? feedItems.findIndex((item) => item.link === rss.last) - 1
            : feedItems.length - 1;
        const newItemsCount = findSavedItemIndex + 1;
        winston.debug("new items: " + newItemsCount, {
          labels: { chat_id: rss.chat_id }
        });

        this.statisticService.create({
          count: newItemsCount,
          chat_id: rss.chat_id
        });
        for (let itemIndex = findSavedItemIndex; itemIndex > -1; itemIndex--) {
          const gapItem = feedItems[itemIndex];
          if (!gapItem.link) {
            if (isDevChat) {
              winston.debug("no gapItem link: " + JSON.stringify(gapItem), {
                labels: { chat_id: rss.chat_id }
              });
            }
            return;
          }

          winston.debug(`Adding job: ${gapItem.link}`, {
            labels: { chat_id: rss.chat_id }
          });
          await this.addMessageJob(rss.chat_id, gapItem);
          if (itemIndex === 0) {
            winston.debug("saving: " + lastItem.link, {
              labels: { chat_id: rss.chat_id }
            });

            await this.updateFeed({
              where: { id: rss.id },
              data: { last: lastItem.link }
            });

            if (isDevChat) {
              const feed = await this.feeds({
                where: { disabled: false, id: rss.id }
              });

              winston.debug("saved in DB: " + JSON.stringify(feed), {
                labels: { chat_id: rss.chat_id }
              });
            }
            winston.debug("Done! saving checkpoint: " + lastItem.link, {
              chaId: { chat_id: rss.chat_id }
            });
          }
        }
      }
      winston.debug("-------------done------------------", {
        labels: { chat_id: rss.chat_id }
      });
    } catch (error) {
      await this.handleFeedFailure(rss, error);
      winston.error(error, { labels: { chat_id: rss.chat_id } });
    }
  }

  async handleFeedFailure(rss: rss, error) {
    try {
      const updatedRss = (
        await this.feeds({
          where: { id: rss.id }
        })
      )[0];

      let failures = [];

      if (updatedRss.failures) {
        failures = JSON.parse(updatedRss.failures);
      }

      failures.push({
        [DateTime.now().toFormat("yyyy-MM-dd TT")]: error.message
      });
      await this.updateFeed({
        where: { id: updatedRss.id },
        data: { failures: JSON.stringify(failures) }
      });

      if (failures.length >= 10) {
        await this.disableFeed({
          chatId: rss.chat_id,
          name: rss.name,
          disable: true
        });
        throw new Error("FEED_FAILURE");
      }
    } catch (error) {
      winston.error(error, { labels: { chat_id: rss.chat_id } });
    }
  }

  async getStats() {
    winston.debug("getting chat stats");
    const enabledFeeds = await this.feeds({ where: { disabled: false } });
    const disabledFeeds = await this.feeds({ where: { disabled: true } });
    const users = uniqueItems(enabledFeeds, "chat_id");
    const stats = {
      feeds: enabledFeeds.length.toString(),
      users: users.toString(),
      disabledFeeds: disabledFeeds.length.toString()
    };

    const chatStats = await this.statisticService.getStats();

    const sum = chatStats
      .sort((a, b) => b._sum.count - a._sum.count)
      .filter((item) => item._sum.count > 1000)
      .map((_) => `${_.chat_id}: ${_._sum.count}\n`)
      .join("");

    await this.telegramService.sendAdminMessage(
      `Enabled feeds: ${stats.feeds}
Active Users: ${stats.users}
Disabled Feeds: ${stats.disabledFeeds}

-- Queue --
Awaiting: ${await this.messagesQueue.count()},
Active: ${await this.messagesQueue.getActiveCount()},
Completed: ${await this.messagesQueue.getCompletedCount()}

-- Chat stats over 1000 --
${sum}
`
    );
  }

  async addMessageJob(chatId: number, feedItem: Parser.Item) {
    try {
      await this.messagesQueue.add(
        "message",
        {
          chatId: chatId,
          feedItem: feedItem
        },
        {
          removeOnComplete: true
        }
      );
    } catch (error) {
      winston.error(error);
    }
  }

  async migrateToMultiChat() {
    winston.debug("migrate to multichat started");
    const feeds = await this.feeds({});
    for (const feed of feeds) {
      if (feed.chat_id === 0 && chatid) {
        winston.debug("feed for migration found");
        try {
          await this.updateFeed({
            where: { id: feed.id },
            data: { chat_id: chatid }
          });
          winston.debug("feed saved");
        } catch (error) {
          winston.debug("error saving migration");
          winston.debug(JSON.stringify(error));
        }
      }
    }
  }
}
