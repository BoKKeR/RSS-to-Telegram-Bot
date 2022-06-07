import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { adminchatid } from "../util/config";
import { Telegraf } from "telegraf";
import { InjectEventEmitter } from "nest-emitter";
import { EventEmitterType } from "src/events";

@Injectable()
export class TelegramService {
  constructor(
    @InjectBot() private bot: Telegraf<any>,
    @InjectEventEmitter()
    private readonly eventEmitter: EventEmitterType
  ) {}

  async sendRss(chatId: number, link: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, link);
    } catch (error) {
      if (error.error_code === 403) {
        this.eventEmitter.emit("disableAllFeeds", {
          chatId: chatId,
          disable: true
        });
        await this.sendAdminMessage("disabling all feeds for" + chatId);
      } else {
        await this.sendAdminMessage(JSON.stringify(error));
      }
    }
  }

  async sendAdminMessage(msg: string) {
    if (!adminchatid) return;
    await this.sendRss(adminchatid, msg);
  }
}
