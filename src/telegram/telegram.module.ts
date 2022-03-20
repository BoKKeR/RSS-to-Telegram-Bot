import { Module } from "@nestjs/common";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [],
  controllers: [],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
