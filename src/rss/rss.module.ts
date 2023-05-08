import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { CustomLoggerModule } from "src/logger/logger.module";
import { StatisticModule } from "src/statistic/statistic.module";
import constants from "src/util/constants";
import { PrismaService } from "../prisma.service";
import { TelegramModule } from "../telegram/telegram.module";
import { RssEventHandler } from "./rss.event.handler";
import { RssService } from "./rss.service";

@Module({
  imports: [
    TelegramModule,
    StatisticModule,
    CustomLoggerModule,
    BullModule.registerQueue({
      name: constants.queue.messages
    })
  ],
  controllers: [],
  providers: [RssService, PrismaService, RssEventHandler],
  exports: [RssService]
})
export class RssModule {}
