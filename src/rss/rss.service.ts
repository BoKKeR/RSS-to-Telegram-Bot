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
    this.logger.debug("CHATID: " + chatid);
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

  async deleteFeed(where: Prisma.rssWhereUniqueInput): Promise<rss> {
    return this.prisma.rss.delete({
      where
    });
  }

  @Interval(delay * 1000)
  async handleInterval() {
    const feeds = await this.feeds({});

    if (feeds.length === 0) {
      return;
    }

    for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
      const element = feeds[feedIndex];
      let feedReq = await getFeedData(element.link);

      // @ts-ignore
      let feed = await parser.parseString(feedReq);

      const feedItems = feed.items;

      const lastItem = feedItems[0];
      this.logger.debug(`\n\n-------checking feed: ${element.name}----------`);
      this.logger.debug("last item: " + lastItem.link);
      if (lastItem.link !== element.last) {
        const findSavedItemIndex =
          feedItems.findIndex((item) => item.link === element.last) !== -1
            ? feedItems.findIndex((item) => item.link === element.last) - 1
            : feedItems.length - 1;
        this.logger.debug("new elements: " + (findSavedItemIndex + 1));

        for (let itemIndex = findSavedItemIndex; itemIndex > -1; itemIndex--) {
          const gapElement = feedItems[itemIndex];
          this.logger.debug("sending: " + gapElement.link);
          await this.telegramService.sendRss(gapElement.link);

          if (itemIndex === 0) {
            this.logger.debug("saving: " + lastItem.link);
            await this.updateFeed({
              where: { name: element.name },
              data: { last: lastItem.link }
            });
            this.logger.debug("done-saving: " + lastItem.link);
          }
        }
      }
      this.logger.debug("-------------done------------------");
    }
  }
}
