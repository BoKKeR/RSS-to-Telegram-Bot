import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { StatisticService } from "./statistic.service";

@Module({
  controllers: [],
  providers: [StatisticService, PrismaService],
  exports: [StatisticService]
})
export class StatisticModule {}
