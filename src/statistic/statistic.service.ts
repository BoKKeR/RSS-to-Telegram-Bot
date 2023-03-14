import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { statistic, Prisma } from "@prisma/client";

@Injectable()
export class StatisticService {
  constructor(private prisma: PrismaService) {}

  dateStringSuffix = (dateOffsetDays?: number) => {
    const date = dateOffsetDays
      ? new Date(new Date().setDate(new Date().getDate() - dateOffsetDays))
      : new Date();
    const iso = date.toISOString();
    return iso.substring(0, iso.indexOf("T"));
  };

  async create(data: Prisma.statisticCreateInput): Promise<statistic> {
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const record = await this.prisma.statistic.findFirst({
      where: {
        chat_id: data.chat_id,
        AND: [
          { created_at: { gte: startDate.toISOString() } },
          { created_at: { lte: endDate.toISOString() } }
        ]
      }
    });

    if (record) {
      await this.prisma.statistic.update({
        where: { id: record.id },
        data: { count: record.count + data.count }
      });
    } else {
      return this.prisma.statistic.create({
        data
      });
    }
  }

  async getStats() {
    return this.prisma.statistic.groupBy({
      by: ["chat_id"],
      _sum: {
        count: true
      }
    });
  }
}
