import { InjectEventEmitter } from "nest-emitter";
import { Update, Help, Command, Start } from "nestjs-telegraf";
import { Context } from "./context.interface";
import { EventEmitterType } from "./events";
import { RssService } from "./rss/rss.service";
import { SettingService } from "./setting/setting.service";
import { adminchatid } from "./util/config";
import mdLoader from "./util/mdLoader";
import { toBoolean } from "./util/toBoolean";

let Parser = require("rss-parser");
let parser = new Parser();

@Update()
export class AppUpdate {
  constructor(
    private rssService: RssService,
    private settingService: SettingService,
    @InjectEventEmitter() private readonly emitter: EventEmitterType
  ) {}

  getMessage(ctx: Context) {
    // @ts-ignore
    return ctx.update.message.text;
  }
  getFromChatId(ctx: Context) {
    return ctx.message.chat.id;
  }

  @Command("list")
  async startCommand(ctx: Context) {
    await this.initializeSettings(ctx);

    const fromId = this.getFromChatId(ctx);

    const list = await this.rssService.feeds({ where: { chat_id: fromId } });

    if (list.length === 0) {
      await ctx.reply("ERROR: The database is empty");
      return;
    }

    for (let elementIndex = 0; elementIndex < list.length; elementIndex++) {
      const entry = list[elementIndex];
      await ctx.reply(
        `Title: ${entry.name}\nRSS URL: ${entry.link}\nLast checked entry: ${entry.last}\nDisabled: ${entry.disabled}`,
        { disable_web_page_preview: true }
      );
    }
  }

  @Command("add")
  async onAdd(ctx: Context) {
    await this.initializeSettings(ctx);

    const text = this.getMessage(ctx);
    const fromId = this.getFromChatId(ctx);

    if (!text || text.split(" ").length === 2) {
      await ctx.reply(
        "ERROR: wrong input, the format needs to be: /add title_name rss_link_url"
      );
      return;
    }

    const name = text.split(" ")[1];
    const link = text.split(" ")[2];

    if (!link || link === "invalid") {
      await ctx.reply(
        "ERROR: something with the link? correct syntax: \n/add title_name rss_link_url"
      );
      return;
    }

    try {
      let feed = await parser.parseURL(link);
      const lastItem = feed.items[0];

      const duplicateCheck = await this.rssService.findFirst({
        where: { link: link, chat_id: fromId }
      });

      if (duplicateCheck) {
        if (duplicateCheck.link === link) {
          await ctx.reply("DUPLICATE: duplicate link");
        }
        if (duplicateCheck.name === name) {
          await ctx.reply("DUPLICATE: duplicate title");
        }

        return;
      }

      await this.rssService.createFeed({
        last: lastItem.link,
        name: name,
        link: link,
        chat_id: fromId,
        disabled: false
      });
      await ctx.reply(
        `ADDED: \nRSS: ${lastItem.link}\nTITLE: ${name}\ndisabled: false`,
        {
          disable_web_page_preview: true
        }
      );
    } catch (error) {
      if (error.code === "P2002") {
        await ctx.reply(
          "ERROR: Duplicate problem when saving with: " +
            JSON.stringify(error.meta.target)
        );
      } else if ((error.code = "ECONNREFUSED")) {
        await ctx.replyWithMarkdown(
          "ERROR: connection refused/not valid RSS link\nif you think this is a mistake [open an issue](https://github.com/BoKKeR/RSS-to-Telegram-Bot/issues) with the given link",
          { disable_web_page_preview: true }
        );
      } else {
        await ctx.reply(error);
      }
    }
  }

  @Command("delete")
  @Command("remove")
  async onRemove(ctx: Context) {
    await this.initializeSettings(ctx);

    const fromId = this.getFromChatId(ctx);
    const entries = this.getMessage(ctx)
      .replace("/remove ", "")
      .replace("/delete ", "")
      .split(" ");

    if (!entries) {
      await ctx.reply(
        "ERROR: wrong input, correct syntax: \n/remove link_name link_name link_name"
      );
      return;
    }
    try {
      for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
        const element = entries[entryIndex];
        await this.rssService.deleteFeed(fromId, element);
        await ctx.reply("REMOVED: " + element);
      }
    } catch (error) {
      if (error === "P2025") {
        await ctx.reply("ERROR: Record not found");
        return;
      }
      await ctx.reply("ERROR " + error);
      return;
    }
  }

  @Command("test")
  async onTest(ctx: Context) {
    await this.initializeSettings(ctx);

    let parser = new Parser();
    let feed = await parser.parseURL("https://www.reddit.com/r/funny/new/.rss");

    const lastItem = feed.items[0];

    await ctx.reply(lastItem.link);
  }

  @Command("disable_all")
  async onDisableAll(ctx: Context) {
    const fromId = this.getFromChatId(ctx);
    const entries = this.getMessage(ctx).split(" ");
    if (!entries.length) {
      await ctx.reply(
        "ERROR: wrong input, correct syntax: \n/disable_all true/false"
      );
      return;
    }

    const disable = toBoolean(entries[1]);

    this.emitter.emit("disableAllFeeds", { chatId: fromId, disable: disable });
    await ctx.reply("All feeds set to disable: " + disable);
  }

  @Command("disable")
  async onDisableFeed(ctx: Context) {
    const entries = this.getMessage(ctx).split(" ");
    if (entries.length !== 3) {
      await ctx.reply(
        "ERROR: wrong input, correct syntax: \n/disable feedName true/false"
      );
      return;
    }

    const feedName = entries[1];
    const disable = toBoolean(entries[2]);

    const chatId = this.getFromChatId(ctx);
    this.emitter.emit("disableFeed", {
      chatId: chatId,
      name: feedName,
      disable: disable
    });
    await ctx.reply(`Feed: ${feedName} set to disable: ${disable}`);
  }

  @Command("settings")
  @Command("setting")
  async onSettings(ctx: Context) {
    await this.initializeSettings(ctx);

    const fromId = this.getFromChatId(ctx);
    let setting = await this.settingService.getSettingByChatId(fromId);

    // @ts-ignore
    const entries = ctx.update.message.text.split(" ");

    if (entries.length > 2) {
      return await ctx.replyWithMarkdown("ERROR: wrong syntax");
    }

    if (entries.length === 2 && entries[1].split("=").length === 2) {
      const [key, value] = entries[1].split("=");
      if (key === "delay" && typeof parseInt(value) === "number") {
        if (parseInt(value) >= 60) {
          await this.settingService.updateSetting({
            where: { chat_id: fromId },
            data: { [key]: parseInt(value) }
          });
        } else {
          ctx.reply("ERROR: delay must be at least 60 seconds");
          return;
        }
      }
      if (key === "show_changelog" && (value === "true" || value === "false")) {
        await this.settingService.updateSetting({
          where: { chat_id: fromId },
          data: { [key]: value === "true" ? true : false }
        });
      }

      setting = await this.settingService.getSettingByChatId(fromId);
    }
    const msg =
      "*Settings*\n\nto change a setting use te following syntax:\n*/settings name=value* \n\nCurrent settings:" +
      "\n\ndelay=" +
      setting.delay +
      "\nshow_changelog=" +
      setting.show_changelog;

    await ctx.replyWithMarkdown(msg.replaceAll("_", "\\_"));
  }

  async initializeSettings(ctx: Context) {
    const chatId = this.getFromChatId(ctx);
    await this.settingService.intializeTable(chatId);
  }

  @Start()
  @Help()
  async help(ctx: Context) {
    await this.initializeSettings(ctx);

    const helpMarkdown = (await mdLoader("help"))
      .replace("CHATID_PLACEHOLDER", ctx.message.chat.id)
      .replace("VERSION_PLACEHOLDER", process.env.npm_package_version);

    try {
      await ctx.replyWithMarkdown(helpMarkdown, {
        disable_web_page_preview: false
      });
    } catch (error) {
      await ctx.replyWithMarkdown("ERROR: " + error);
    }
  }

  @Command("stats")
  async stats(ctx: Context) {
    const fromId = this.getFromChatId(ctx);
    if (fromId !== adminchatid) return;

    await this.rssService.getStats();
  }
}
