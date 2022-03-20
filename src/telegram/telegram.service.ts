import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { chatid } from "../util/config";
import { Telegraf } from "telegraf";

@Injectable()
export class TelegramService {
  constructor(@InjectBot() private bot: Telegraf<any>) {}

  async sendRss(link: string) {
    await this.bot.telegram.sendMessage(chatid, link);
  }
}
