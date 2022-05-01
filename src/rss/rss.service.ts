import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { rss, Prisma } from "@prisma/client";
import { Interval } from "@nestjs/schedule";
import { chatid, delay } from "../util/config";
import * as Parser from "rss-parser";
import { getFeedData } from "../util/axios";
import { TelegramService } from "../telegram/telegram.service";
import { CustomLoggerService } from "../logger/logger.service";

let parser = new Parser();
@Injectable()
export class RssService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
    private logger: CustomLoggerService
  ) {
    this.logger.setContext("RssService");
    this.logger.debug("DELAY: " + delay + " seconds");
    this.migrateToMultiChat();
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

  @Interval(delay * 1000)
  async handleInterval() {
    const feeds = await this.feeds({});

    if (feeds.length === 0) {
      return;
    }

    for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
      const currentFeed = feeds[feedIndex];
      let feedReq = await getFeedData(currentFeed.link);

      // @ts-ignore
      let feed = await parser.parseString(feedReq);

      const feedItems = feed.items;

      const lastItem = feedItems[0];
      this.logger.debug(
        `\n\n-------checking feed: ${currentFeed.name}----------`
      );
      this.logger.debug("last item: " + lastItem.link);
      if (lastItem.link !== currentFeed.last) {
        const findSavedItemIndex =
          feedItems.findIndex((item) => item.link === currentFeed.last) !== -1
            ? feedItems.findIndex((item) => item.link === currentFeed.last) - 1
            : feedItems.length - 1;
        this.logger.debug("new elements: " + (findSavedItemIndex + 1));

        for (let itemIndex = findSavedItemIndex; itemIndex > -1; itemIndex--) {
          const gapElement = feedItems[itemIndex];
          this.logger.debug("sending: " + gapElement.link);
          await this.telegramService.sendRss(
            currentFeed.chat_id,
            gapElement.link
          );
          if (itemIndex === 0) {
            this.logger.debug("saving: " + lastItem.link);

            await this.updateFeed({
              where: { id: currentFeed.id },
              data: { last: lastItem.link }
            });
            this.logger.debug("done-saving: " + lastItem.link);
          } else {
            this.logger.debug("sleep");
            await this.sleep(); // sleep to prevent overloading the api
          }
        }
      }
      this.logger.debug("-------------done------------------");
    }
  }

  async migrateToMultiChat() {
    this.logger.debug("migrate to multichat started");
    const feeds = await this.feeds({});
    for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
      const feed = feeds[feedIndex];

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
