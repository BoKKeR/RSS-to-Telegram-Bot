import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { AppUpdate } from "./app.update";

// TODO: check so the ENV gets loaded from ENV not just .env

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
    }),
  ],
  controllers: [],
  providers: [AppService, AppUpdate],
})
export class AppModule {}
