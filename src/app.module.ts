import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { TelegrafModule } from "nestjs-telegraf";
import { AppUpdate } from "./app.update";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
    }),
  ],
  controllers: [],
  providers: [AppService, AppUpdate, PrismaService],
})
export class AppModule {}
