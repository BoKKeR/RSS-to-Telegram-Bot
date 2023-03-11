import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { CustomLoggerModule } from "src/logger/logger.module";
import { PrismaService } from "../prisma.service";
import { TelegramModule } from "../telegram/telegram.module";
import { RssEventHandler } from "./rss.event.handler";
import { RssService } from "./rss.service";

@Module({
  imports: [
    TelegramModule,
    CustomLoggerModule,
    BullModule.registerQueue({
      name: "messages"
    })
  ],
  controllers: [],
  providers: [RssService, PrismaService, RssEventHandler],
  exports: [RssService]
})
export class RssModule {}
