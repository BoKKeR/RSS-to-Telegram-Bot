import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { AppUpdate } from "./app.update";
import { RssModule } from "./rss/rss.module";
import { ScheduleModule } from "@nestjs/schedule";
import { SettingModule } from "./setting/setting.module";
import { NestEmitterModule } from "nest-emitter";
import { EventEmitter } from "events";
import { TelegramModule } from "./telegram/telegram.module";
import { BullModule } from "@nestjs/bull";
import constants from "./util/constants";
@Module({
  imports: [
    NestEmitterModule.forRoot(new EventEmitter()),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TOKEN
    }),
    RssModule,
    SettingModule,
    TelegramModule,
    BullModule.forRoot({
      redis: {
        host: constants.env.REDIS_HOST,
        port: constants.env.REDIS_PORT,
        password: constants.env.REDIS_PASSWORD,
        username: constants.env.REDIS_USER
          ? constants.env.REDIS_USER
          : "default"
      }
    })
  ],
  controllers: [],
  providers: [AppService, AppUpdate]
})
export class AppModule {}
