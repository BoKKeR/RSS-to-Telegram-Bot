import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { AppUpdate } from "./app.update";
import { RssModule } from "./rss/rss.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
    }),
    RssModule,
  ],
  controllers: [],
  providers: [AppService, AppUpdate],
})
export class AppModule {}
