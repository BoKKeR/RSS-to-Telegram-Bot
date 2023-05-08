import { Module } from "@nestjs/common";
import { CustomLoggerModule } from "src/logger/logger.module";
import { PrismaService } from "../prisma.service";
import { TelegramModule } from "../telegram/telegram.module";
import { SettingService } from "./setting.service";

@Module({
  imports: [TelegramModule, CustomLoggerModule],
  controllers: [],
  providers: [SettingService, PrismaService],
  exports: [SettingService]
})
export class SettingModule {}
