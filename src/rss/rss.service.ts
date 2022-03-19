import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Rss, Prisma } from "@prisma/client";
import { Interval } from "@nestjs/schedule";
import { delay } from "../util/config";

import * as Parser from "rss-parser";
import { getFeedData } from "../util/axios";
let parser = new Parser();
import * as fs from "fs";
@Injectable()
export class RssService {
  constructor(private prisma: PrismaService) {}

  async feed(
    userWhereUniqueInput: Prisma.RssWhereUniqueInput
  ): Promise<Rss | null> {
    return this.prisma.rss.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async feeds(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RssWhereUniqueInput;
    where?: Prisma.RssWhereInput;
    orderBy?: Prisma.RssOrderByWithRelationInput;
  }): Promise<Rss[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.rss.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createFeed(data: Prisma.RssCreateInput): Promise<Rss> {
    return this.prisma.rss.create({
      data,
    });
  }

  async updateFeed(params: {
    where: Prisma.RssWhereUniqueInput;
    data: Prisma.RssUpdateInput;
  }): Promise<Rss> {
    const { where, data } = params;
    return this.prisma.rss.update({
      data,
      where,
    });
  }

  async deleteFeed(where: Prisma.RssWhereUniqueInput): Promise<Rss> {
    return this.prisma.rss.delete({
      where,
    });
  }

  @Interval(delay * 1000)
  async handleInterval() {
    const feeds = await this.feeds({});

    if (feeds.length === 0) {
      return;
    }

    for (let itemIndex = 0; itemIndex < feeds.length; itemIndex++) {
      const element = feeds[itemIndex];
      let feedReq = getFeedData(element.link).toString();

      let feed = await parser.parseString(feedReq);

      const feedItems = feed.items;

      // 0 is the last item!
      const lastItem = feedItems[0];
      if (lastItem.link !== element.last) {
        const findSavedItemIndex =
          feedItems.findIndex((item) => item.link === element.last) !== -1
            ? feedItems.findIndex((item) => item.link === element.last) - 1
            : 0;

        for (
          let itemIndex = findSavedItemIndex;
          itemIndex < feedItems.length;
          itemIndex++
        ) {
          const gapElement = feedItems[itemIndex];
          if (
            // fix this OR part, make some test cases
            itemIndex != feedItems.length - 1 &&
            gapElement.link !== element.last &&
            gapElement.link !== lastItem.link
          ) {
            console.log("found: " + gapElement.link);
          } else {
            console.log("done itterating, writing " + lastItem.link);
            await this.updateFeed({
              where: { name: element.name },
              data: { last: lastItem.link },
            });
            return;
          }
        }
      } else {
        console.log("no_new_items");
      }
    }
  }
}
