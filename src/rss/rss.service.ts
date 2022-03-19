import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Rss, Prisma } from "@prisma/client";
import { Interval } from "@nestjs/schedule";
import { delay } from "src/util/config";

@Injectable()
export class RssService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.RssWhereUniqueInput
  ): Promise<Rss | null> {
    return this.prisma.rss.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
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

  async createUser(data: Prisma.RssCreateInput): Promise<Rss> {
    return this.prisma.rss.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.RssWhereUniqueInput;
    data: Prisma.RssUpdateInput;
  }): Promise<Rss> {
    const { where, data } = params;
    return this.prisma.rss.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.RssWhereUniqueInput): Promise<Rss> {
    return this.prisma.rss.delete({
      where,
    });
  }

  @Interval(delay * 1000)
  handleInterval() {
    console.log("here");
  }
}
