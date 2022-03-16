import { Update, Help, Command } from "nestjs-telegraf";
import { Context } from "./context.interface";
import { RssService } from "./rss/rss.service";
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

    if (link) {
      let feed = await parser.parseURL("https://www.reddit.com/.rss");
      feed.items.forEach((item) => {
        console.log(item.title + ":" + item.link);
      });
    }

    await this.rssService.createUser({
      last: " idk",
      name: name,
      link: link,
    });
    await ctx.reply("added");
  }

  @Command("remove")
  async onRemove(ctx: Context) {}

  @Command("test")
  async onTest(ctx: Context) {
    let parser = new Parser();
    let feed = await parser.parseURL("https://www.reddit.com/r/funny/new/.rss");
    feed.items.forEach((item) => {
      console.log(item.title + ":" + item.link);
    });
    const lastItem = feed.items.reverse()[0];

    await ctx.reply(lastItem.link);
  }

  @Help()
  async help(ctx: Context) {
    await ctx.replyWithMarkdown(
      "RSS to Telegram bot" +
        "\n\nAfter successfully adding a RSS link, the bot starts fetching the feed every " +
        "delay" +
        " seconds. (This can be set)" +
        "\n\nTitles are used to easily manage RSS feeds and need to contain only one word" +
        "\n\ncommands:" +
        "\n/help Posts this help message" +
        "\n/add title http://www.RSS-URL.com" +
        "\n/remove !Title! removes the RSS link" +
        "\n/list Lists all the titles and the RSS links from the DB" +
        "\n/test Inbuilt command that fetches a post from Reddits RSS." +
        "\n\nThe current chatId is: " +
        "\n\nIf you like the project, star it on [DockerHub](https://hub.docker.com/r/bokker/rss.to.telegram)"
    );
  }
}
