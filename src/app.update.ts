import { Update, Help, Command } from "nestjs-telegraf";
import { Context } from "./context.interface";
import { RssService } from "./rss/rss.service";
import { chatid, delay } from "./util/config";

let Parser = require("rss-parser");
let parser = new Parser();

@Update()
export class AppUpdate {
  constructor(private rssService: RssService) {}

  @Command("list")
  async startCommand(ctx: Context) {
    const list = await this.rssService.feeds({});

    if (list.length === 0) {
      await ctx.reply("ERROR: The database is empty");
      return;
    }

    for (let elementIndex = 0; elementIndex < list.length; elementIndex++) {
      const entry = list[elementIndex];
      await ctx.reply(
        `Title: ${entry.name}\nRSS URL: ${entry.link}\nLast checked entry: ${entry.last}`,
        { disable_web_page_preview: true }
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
        where: { link: link }
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
        link: link
      });
      await ctx.reply(`ADDED: \nRSS: ${lastItem.link}\nTITLE: ${name}`, {
        disable_web_page_preview: true
      });
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
    // @ts-ignore
    const entries = ctx.update.message.text
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

        await this.rssService.deleteFeed({ name: element });
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

    const lastItem = feed.items[0];

    await ctx.reply(lastItem.link);
  }

  @Help()
  async help(ctx: Context) {
    try {
      await ctx.replyWithMarkdown(
        "RSS to Telegram bot *v" +
          process.env.npm_package_version +
          "\n\n*After successfully adding a RSS link, the bot starts fetching the feed *every " +
          delay +
          " seconds*. (This can be changed)" +
          "\n\nTitles are used to easily manage RSS feeds and need to contain only one word" +
          "\n\ncommands:" +
          "\n`/help` shows this help message" +
          "\n`/add title http://www.RSS-URL.com`" +
          "\n`/remove link_name` removes the RSS link, multiple links can be removed with one command" +
          "\n`/list` Lists all the titles and the RSS links from the DB" +
          "\n`/test` Inbuilt command that fetches a post from Reddits RSS." +
          "\n\nThe current chatId is: " +
          chatid +
          "\n\nIf you like the project, ⭐ it on [DockerHub](https://hub.docker.com/r/bokker/rss.to.telegram) / [GitHub](https://www.github.com/BoKKeR/RSS-to-Telegram-Bot)",
        {
          disable_web_page_preview: false
        }
      );
    } catch (error) {
      await ctx.replyWithMarkdown("ERROR: " + error);
    }
  }
}
