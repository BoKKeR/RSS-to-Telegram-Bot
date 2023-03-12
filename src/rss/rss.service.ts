import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { rss, Prisma } from "@prisma/client";
import { Interval } from "@nestjs/schedule";
import { chatid, delay } from "../util/config";
import * as Parser from "rss-parser";
import { getFeedData } from "../util/axios";
import { TelegramService } from "../telegram/telegram.service";
import { CustomLoggerService } from "../logger/logger.service";
import uniqueItems from "../util/uniqueItems";
import { Telegraf } from "telegraf";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import constants from "src/util/constants";
let parser = new Parser();
let bot = new Telegraf(process.env.TOKEN);
@Injectable()
export class RssService implements OnModuleInit {
  constructor(
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue,
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private logger: CustomLoggerService
  ) {
    this.logger.setContext("RssService");
    this.logger.debug("DELAY: " + delay + " seconds");
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

  async sleep() {
    await new Promise((resolve) => setTimeout(resolve, 3500));
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
      try {
        let feedReq = await getFeedData(currentFeed.link);

        // @ts-ignore
        let feed = await parser.parseString(feedReq);

        const feedItems = feed.items;

        const lastItem = feedItems[0];
        this.logger.debug(
          `\n\n-------checking feed: ${currentFeed.name}----------`
        );
        this.logger.debug("last: " + lastItem.link);
        if (lastItem.link !== currentFeed.last) {
          const findSavedItemIndex =
            feedItems.findIndex((item) => item.link === currentFeed.last) !== -1
              ? feedItems.findIndex((item) => item.link === currentFeed.last) -
                1
              : feedItems.length - 1;
          this.logger.debug("new items: " + (findSavedItemIndex + 1));

          for (
            let itemIndex = findSavedItemIndex;
            itemIndex > -1;
            itemIndex--
          ) {
            const gapItem = feedItems[itemIndex];
            if (!gapItem.link) return;

            if (!gapItem.link) return;

            this.logger.debug("sending: " + gapItem.link);
            await this.telegramService.sendRss(
              currentFeed.chat_id,
              gapItem.link
            );

            let rssOption_image = await this.prisma.setting.findFirst({where: {feed_type:"image"}});
            let rssOption_title = await this.prisma.setting.findFirst({where: {feed_type: "title"}});

            if(rssOption_image) {
              let regex = /<img src="([^"]*)"/;
              let image = regex.exec(gapItem.content);
              //send image with caption
              try {
                this.logger.debug("sending: " + image[1]);
                let caption = `<a href="${gapItem.link}">${gapItem.title}</a>`

                if(gapItem.creator) {
                  caption += `\nBy ${gapItem.creator}`
                }

                await bot.telegram.sendPhoto(
                  currentFeed.chat_id,
                  {url: `${image[1]}`},
                  {parse_mode: "HTML", caption}
                )
                //change message format when image process fails
              } catch (error) {
                if(error.description === "Bad Request: IMAGE_PROCESS_FAILED") {
                  let message = `No valid image\n\n<a href="${gapItem.link}">${gapItem.title}</a>`;

                  if(gapItem.creator) {
                    message += `\nBy ${gapItem.creator}`;
                  }

                  this.logger.debug("sending: " + gapItem.link)
                  await bot.telegram.sendMessage(
                    currentFeed.chat_id,
                    message,
                    {parse_mode: "HTML"}
                  )
                }
              }
            } else if(rssOption_title){
              this.logger.debug("sending: " + gapItem.title);

              let message = `<a href="${gapItem.link}">${gapItem.title}</a>`;

              if(gapItem.creator) {
                message += `\nBy ${gapItem.creator}`;
              }
              
              await bot.telegram.sendMessage(
                currentFeed.chat_id,
                message,
                {parse_mode: "HTML"}
              )
            } else {
              this.logger.debug("sending: " + gapItem.link);
              await bot.telegram.sendMessage(
                currentFeed.chat_id,
                gapItem.link
              )
            }

            if (itemIndex === 0) {
              this.logger.debug("saving: " + lastItem.link);

              await this.updateFeed({
                where: { id: currentFeed.id },
                data: { last: lastItem.link }
              });
              this.logger.debug("Done! saving checkpoint: " + lastItem.link);
            }
          }
        }
        this.logger.debug("-------------done------------------");
      } catch (error) {
        console.log(error);
      }
    }
  }

  async getStats() {
    this.logger.debug("getting chat stats");
    const enabledFeeds = await this.feeds({ where: { disabled: false } });
    const disabledFeeds = await this.feeds({ where: { disabled: true } });
    const users = uniqueItems(enabledFeeds, "chat_id");
    const stats = {
      feeds: enabledFeeds.length.toString(),
      users: users.toString(),
      disabledFeeds: disabledFeeds.length.toString()
    };
    await this.telegramService.sendAdminMessage(
      `Enabled feeds: ${stats.feeds}
Active Users: ${stats.users}
Disabled Feeds: ${stats.disabledFeeds}

-- Queue --
Awaiting: ${await this.messagesQueue.count()},
Active: ${await this.messagesQueue.getActiveCount()},
Completed: ${await this.messagesQueue.getCompletedCount()}`
    );
  }

  async addJob(chatId: number, feedItem: Parser.Item) {
    try {
      await this.messagesQueue.add("message", {
        chatId: chatId,
        feedItem: feedItem
      });
    } catch (error) {
      console.log(error);
    }
  }

  async migrateToMultiChat() {
    this.logger.debug("migrate to multichat started");
    const feeds = await this.feeds({});
    for (const feed of feeds) {
      if (feed.chat_id === 0 && chatid) {
        this.logger.debug("feed for migration found");
        try {
          await this.updateFeed({
            where: { id: feed.id },
            data: { chat_id: chatid }
          });
          this.logger.debug("feed saved");
        } catch (error) {
          this.logger.debug("error saving migration");
          this.logger.debug(JSON.stringify(error));
        }
      }
    }
  }
}
