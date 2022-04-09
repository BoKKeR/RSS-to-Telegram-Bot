import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { chatid } from "../util/config";
import { Telegraf } from "telegraf";

@Injectable()
export class TelegramService {
  constructor(@InjectBot() private bot: Telegraf<any>) {
    if (true) this.postChangelog();
  }

  async sendRss(link: string) {
    await this.bot.telegram.sendMessage(chatid, link);
  }

  async postChangelog() {
    if (process.env.JUST_MIGRATED_TO_JS === "true") {
      await this.bot.telegram.sendMessage(chatid, "HOLA");
    }
  }
}
