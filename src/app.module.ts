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

@Module({
  imports: [
    NestEmitterModule.forRoot(new EventEmitter()),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TOKEN
    }),
    RssModule,
    SettingModule
  ],
  controllers: [],
  providers: [AppService, AppUpdate]
})
export class AppModule {}
