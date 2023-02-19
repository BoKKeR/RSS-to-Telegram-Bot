import { Injectable } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { adminchatid } from "../util/config";
import { Telegraf } from "telegraf";
import { InjectEventEmitter } from "nest-emitter";
import { EventEmitterType } from "../events";
import mdLoader from "../util/mdLoader";

@Injectable()
export class TelegramService {
  constructor(
    @InjectBot() private bot: Telegraf<any>,
    @InjectEventEmitter()
    private readonly eventEmitter: EventEmitterType
  ) {}

  async onApplicationBootstrap() {
    const commands = (await mdLoader("help"))
      .split("\n")
      .map((line: string) => {
        if (line.startsWith("*/")) {
          const command = line.replace("* ", "*/ ").split("*/");
          const description = line.split("* ");
          return { command: command[1], description: description[1] };
        }
      })
      .filter((anyValue) => typeof anyValue !== "undefined");

    await this.bot.telegram.setMyCommands(commands);
  }

  async sendRss(chatId: number, link: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, link);
    } catch (error) {
      if (
        error.response.error_code === 403 ||
        error.response.description === "Bad Request: chat not found"
      ) {
        this.eventEmitter.emit("disableAllFeeds", {
          chatId: chatId,
          disable: true
        });
        await this.sendAdminMessage("Disabling all feeds for " + chatId);
      } else if (error.response.parameters.migrate_to_chat_id) {
        const newChatId = error.response.parameters.migrate_to_chat_id;
        this.eventEmitter.emit("migrateChat", {
          chatId: chatId,
          newChatId: newChatId
        });
        await this.sendAdminMessage(
          `Migrated chat from ${chatId} to ${newChatId}`
        );
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
