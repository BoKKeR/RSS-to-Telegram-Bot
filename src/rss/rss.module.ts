import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { RssService } from "./rss.service";

@Module({
  imports: [],
  controllers: [],
  providers: [RssService, PrismaService],
  exports: [RssService],
})
export class RssModule {}
