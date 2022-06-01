import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { adminchatid } from "src/util/config";
import { Telegraf } from "telegraf";

@Injectable()
export class TelegramService {
  constructor(@InjectBot() private bot: Telegraf<any>) {}

  async sendRss(chatId: number, link: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, link);
    } catch (error) {
      console.log(error);
      await this.sendAdminMessage(JSON.stringify(error));
    }
  }

  async sendAdminMessage(error: string) {
    if (!adminchatid) return;
    await this.sendRss(adminchatid, error);
  }
}
