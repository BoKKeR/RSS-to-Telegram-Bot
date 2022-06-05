import { Module } from "@nestjs/common";
import { CustomLoggerModule } from "src/logger/logger.module";
import { PrismaService } from "../prisma.service";
import { TelegramModule } from "../telegram/telegram.module";
import { RssEventHandler } from "./rss.event.handler";
import { RssService } from "./rss.service";

@Module({
  imports: [TelegramModule, CustomLoggerModule],
  controllers: [],
  providers: [RssService, PrismaService, RssEventHandler],
  exports: [RssService]
})
export class RssModule {}
