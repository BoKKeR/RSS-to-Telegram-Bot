import { Update, Help, Command } from "nestjs-telegraf";
import { Context } from "./context.interface";
import { RssService } from "./rss/rss.service";
import { delay } from "./util/config";
let Parser = require("rss-parser");
@Update()
export class AppUpdate {
  constructor(private rssService: RssService) {}

  @Command("list")
  async startCommand(ctx: Context) {
    const list = await this.rssService.users({});
    await ctx.reply(JSON.stringify(list));
  }

  @Command("add")
  async onAdd(ctx: Context) {
    // @ts-ignore
    const text = ctx.update.message.text;

    if (!text || text.split(" ").length === 2) {
      await ctx.reply("Error input");
      return;
    }

    const name = text.split(" ")[1];
    const link = text.split(" ")[2];

    let parser = new Parser();

    if (!link || link === "invalid") {
      await ctx.reply(
        "Error: something with the link? correct syntax: \n/add link_name rss_link_url"
      );
      return;
    }

    let feed = await parser.parseURL("https://www.reddit.com/r/funny/new/.rss");
    const lastItem = feed.items.reverse()[0];

    try {
      await this.rssService.createUser({
        last: lastItem.link,
        name: name,
        link: link,
      });
      await ctx.reply(`added link to database as: **${name}** 

Last item link+title:
link: ${lastItem.link}
text: ${lastItem.text}
      `);
    } catch (error) {
      if (error.code === "P2002") {
        await ctx.reply("Error: Duplicate link");
      }
    }
  }

  @Command("remove")
  async onRemove(ctx: Context) {
    // @ts-ignore
    const entry = ctx.update.message.text.split(" ")[1];
    if (!entry) {
      await ctx.reply(
        "Error: wrong input, correct syntax: \n/remove link_name"
      );
      return;
    }
    try {
      await this.rssService.deleteUser({ name: entry });
    } catch (error) {
      if (error === "P2025") {
        await ctx.reply("Record not found");
        return;
      }
      await ctx.reply("Error " + error);
      return;
    }
    await ctx.reply("Removed");
  }

  @Command("test")
  async onTest(ctx: Context) {
    let parser = new Parser();
    let feed = await parser.parseURL("https://www.reddit.com/r/funny/new/.rss");

    const lastItem = feed.items.reverse()[0];

    await ctx.reply(lastItem.link);
  }

  @Help()
  async help(ctx: Context) {
    await ctx.replyWithMarkdown(
      "RSS to Telegram bot v" +
        process.env.npm_package_version +
        "\n\nAfter successfully adding a RSS link, the bot starts fetching the feed every " +
        delay +
        " seconds. (This can be changed)" +
        "\n\nTitles are used to easily manage RSS feeds and need to contain only one word" +
        "\n\ncommands:" +
        "\n/help Posts this help message" +
        "\n/add title http://www.RSS-URL.com" +
        "\n/remove !Title! removes the RSS link" +
        "\n/list Lists all the titles and the RSS links from the DB" +
        "\n/test Inbuilt command that fetches a post from Reddits RSS." +
        "\n\nThe current chatId is: " +
        "\n\nIf you like the project, ⭐ it on [DockerHub](https://hub.docker.com/r/bokker/rss.to.telegram) / [GitHub](https://www.github.com/BoKKeR/RSS-to-Telegram-Bot)",
      {
        disable_web_page_preview: true,
      }
    );
  }
}
