import { Update, Help, Command } from "nestjs-telegraf";
import { Context } from "./context.interface";

@Update()
export class AppUpdate {
  constructor() {}

  @Command("list")
  async startCommand(ctx: Context) {
    await ctx.reply("Welcome");
  }

  @Command("add")
  async onAdd(ctx: Context) {
    await ctx.reply("👍");
  }

  @Command("remove")
  async onRemove(ctx: Context) {
    await ctx.reply("👍");
  }

  @Command("test")
  async onTest(ctx: Context) {
    await ctx.reply("👍");
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
