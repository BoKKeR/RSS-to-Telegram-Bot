import { Update, Help, Command } from "nestjs-telegraf";
import { Context } from "./context.interface";
import { RssService } from "./rss/rss.service";
import { chatid, delay } from "./util/config";
let Parser = require("rss-parser");
@Update()
export class AppUpdate {
  constructor(private rssService: RssService) {}

  @Command("list")
  async startCommand(ctx: Context) {
    const list = await this.rssService.users({});

    if (list.length === 0) {
      await ctx.reply("The database is empty");
      return;
    }

    for (let elementIndex = 0; elementIndex < list.length; elementIndex++) {
      const entry = list[elementIndex];
      await ctx.reply(
        `title: ${entry.name}\nrss url: ${entry.link}\nlast checked entry: ${entry.last}`
      );
    }
  }

  @Command("add")
  async onAdd(ctx: Context) {
    // @ts-ignore
    const text = ctx.update.message.text;

    if (!text || text.split(" ").length === 2) {
      await ctx.reply(
        "ERROR: wrong input, the format needs to be: /add title_name rss_link_url"
      );
      return;
    }

    const name = text.split(" ")[1];
    const link = text.split(" ")[2];

    let parser = new Parser();

    if (!link || link === "invalid") {
      await ctx.reply(
        "ERROR: something with the link? correct syntax: \n/add link_name rss_link_url"
      );
      return;
    }

    let feed = await parser.parseURL(link);
    const lastItem = feed.items.reverse()[0];

    try {
      await this.rssService.createUser({
        last: lastItem.link,
        name: name,
        link: link,
      });
      await ctx.reply(`ADDED: \nRSS: ${lastItem.link}\nTITLE: ${name}`);
    } catch (error) {
      if (error.code === "P2002") {
        await ctx.reply("ERROR: Duplicate link");
      }
    }
  }

  @Command("remove")
  async onRemove(ctx: Context) {
    // @ts-ignore
    const entries = ctx.update.message.text.replace("/remove ", "").split(" ");

    if (!entries) {
      await ctx.reply(
        "ERROR: wrong input, correct syntax: \n/remove link_name link_name link_name"
      );
      return;
    }
    try {
      for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
        const element = entries[entryIndex];

        await this.rssService.deleteUser({ name: element });
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
    let parser = new Parser();
    let feed = await parser.parseURL("https://www.reddit.com/r/funny/new/.rss");

    const lastItem = feed.items.reverse()[0];

    await ctx.reply(lastItem.link);
  }

  @Help()
  async help(ctx: Context) {
    try {
      await ctx.replyWithMarkdown(
        "RSS to Telegram bot v" +
          process.env.npm_package_version +
          "\n\nAfter successfully adding a RSS link, the bot starts fetching the feed *every " +
          delay +
          " seconds*. (This can be changed)" +
          "\n\nTitles are used to easily manage RSS feeds and need to contain only one word" +
          "\n\ncommands:" +
          "\n`/help` shows this help message" +
          "\n`/add title http://www.RSS-URL.com`" +
          "\n`/remove link_name` removes the RSS link, multiple links can be removed with one command" +
          "\n`/list` Lists all the titles and the RSS links from the DB" +
          "\n`/test` Inbuilt command that fetches a post from Reddits RSS." +
          "\n\nThe current set chatId is: " +
          chatid +
          "\n\nIf you like the project, ⭐ it on [DockerHub](https://hub.docker.com/r/bokker/rss.to.telegram) / [GitHub](https://www.github.com/BoKKeR/RSS-to-Telegram-Bot)",
        {
          disable_web_page_preview: false,
        }
      );
    } catch (error) {
      await ctx.replyWithMarkdown("ERROR: " + error);
    }
  }
}
