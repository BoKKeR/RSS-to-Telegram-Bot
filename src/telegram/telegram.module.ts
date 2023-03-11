import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { CustomLoggerModule } from "src/logger/logger.module";
import constants from "src/util/constants";
import { TelegramProcessor } from "./telegram.processor";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: constants.queue.messages
    }),
    CustomLoggerModule
  ],
  controllers: [],
  providers: [TelegramService, TelegramProcessor],
  exports: [TelegramService]
})
export class TelegramModule {}
