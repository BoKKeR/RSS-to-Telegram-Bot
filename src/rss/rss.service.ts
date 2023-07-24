import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { rss, Prisma } from "@prisma/client";
import { Interval } from "@nestjs/schedule";
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

const winston = getLogger();

let parser = new Parser();
@Injectable()
export class RssService implements OnModuleInit {
  constructor(
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue,
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
    this.messagesQueue.resume();
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
    return this.prisma.rss.update({
      data,
      where
    });
  }

  async deleteFeed(chatId: number, name: string): Promise<rss> {
    const result = await this.prisma.rss.findFirst({
      where: {
        chat_id: chatId,
        name: name
      }
    });

    if (result) {
      return await this.prisma.rss.delete({ where: { id: result.id } });
    }
  }

  async deleteOne(where: Prisma.rssWhereUniqueInput): Promise<rss> {
    return this.prisma.rss.delete({
      where
    });
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
  }

  async disableFeed(dto: { name: string; disable: boolean }) {
    await this.prisma.rss.updateMany({
      where: { name: dto.name },
      data: { disabled: dto.disable }
    });
  }

  @Interval(delay * 1000)
  async handleInterval() {
    const feeds = await this.feeds({ where: { disabled: false } });

    if (feeds.length === 0) {
      return;
    }

    for (const currentFeed of feeds) {
      const isDevChat = currentFeed.chat_id === -1001116967488;
      try {
        let feedReq = await getFeedData(currentFeed.link);

        // @ts-ignore
        let feed = await parser.parseString(feedReq);

        const feedItems = feed.items;

        const lastItem = feedItems[0];
        if (isDevChat) {
          winston.debug("feedItems: " + JSON.stringify(feedItems), {
            labels: { chat_id: currentFeed.chat_id }
          });
        }
        winston.debug(`-------checking feed: ${currentFeed.name}---------- `, {
          labels: { chat_id: currentFeed.chat_id }
        });
        winston.debug("last: " + lastItem.link, {
          labels: { chat_id: currentFeed.chat_id }
        });
        if (lastItem.link !== currentFeed.last) {
          if (isDevChat) {
            winston.debug("current feed last:" + currentFeed.last, {
              labels: { chat_id: currentFeed.chat_id }
            });
          }
          const findSavedItemIndex =
            feedItems.findIndex((item) => item.link === currentFeed.last) !== -1
              ? feedItems.findIndex((item) => item.link === currentFeed.last) -
                1
              : feedItems.length - 1;
          const newItemsCount = findSavedItemIndex + 1;
          winston.debug("new items: " + newItemsCount, {
            labels: { chat_id: currentFeed.chat_id }
          });

          this.statisticService.create({
            count: newItemsCount,
            chat_id: currentFeed.chat_id
          });
          for (
            let itemIndex = findSavedItemIndex;
            itemIndex > -1;
            itemIndex--
          ) {
            const gapItem = feedItems[itemIndex];
            if (!gapItem.link) {
              if (isDevChat) {
                winston.debug("no gapItem link: " + JSON.stringify(gapItem), {
                  labels: { chat_id: currentFeed.chat_id }
                });
              }
              return;
            }

            winston.debug(`Adding job: ${gapItem.link}`, {
              labels: { chat_id: currentFeed.chat_id }
            });
            await this.addJob(currentFeed.chat_id, gapItem);
            if (itemIndex === 0) {
              winston.debug("saving: " + lastItem.link, {
                labels: { chat_id: currentFeed.chat_id }
              });

              await this.updateFeed({
                where: { id: currentFeed.id },
                data: { last: lastItem.link }
              });

              if (isDevChat) {
                const feed = await this.feeds({
                  where: { disabled: false, id: currentFeed.id }
                });

                winston.debug("saved in DB: " + JSON.stringify(feed), {
                  labels: { chat_id: currentFeed.chat_id }
                });
              }
              winston.debug("Done! saving checkpoint: " + lastItem.link, {
                chaId: { chat_id: currentFeed.chat_id }
              });
            }
          }
        }
        winston.debug("-------------done------------------", {
          labels: { chat_id: currentFeed.chat_id }
        });
      } catch (error) {
        winston.error(error, { labels: { chat_id: currentFeed.chat_id } });
      }
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

  async addJob(chatId: number, feedItem: Parser.Item) {
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
