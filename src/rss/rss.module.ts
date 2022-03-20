import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TelegramModule } from "../telegram/telegram.module";
import { RssService } from "./rss.service";

@Module({
  imports: [TelegramModule],
  controllers: [],
  providers: [RssService, PrismaService],
  exports: [RssService],
})
export class RssModule {}
