import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueStalled,
  OnGlobalQueuePaused,
  InjectQueue
} from "@nestjs/bull";
import { DoneCallback, Job, Queue } from "bull";
import constants from "src/util/constants";
import { CustomLoggerService } from "src/logger/logger.service";
import { TelegramService } from "./telegram.service";
import { Item } from "rss-parser";
import { PrismaService } from "src/prisma.service";
import { chatid } from "src/util/config";
@Processor(constants.queue.messages)
export class TelegramProcessor {
  constructor(
    private logger: CustomLoggerService,
    private readonly telegramService: TelegramService,
    private prisma: PrismaService,
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue
  ) {}

  @Process("message")
  async processName(
    job: Job<{ feedItem: Item; chatId: number }>,
    done: DoneCallback
  ) {

    let feedItem = job.data.feedItem;
    let imageSrc = /<img src="([^"]*)"/.exec(feedItem.content);
    let caption = `<a href="${feedItem.link}">${feedItem.title}</a>`;

    let setting = await this.prisma.setting.findFirst({
      where: {
        chat_id: chatid
      }
    });

    let feed_type = setting.feed_type;


    this.logger.debug(
      `@Process id:${job.id} attempts:${job.attemptsMade} message:${job.data.feedItem.link}`
    );

    if(feed_type === "image"){
      //if the image source is null, send title instead
      if(imageSrc) {
        if(feedItem.creator) {
          caption += `\nBy ${feedItem.creator}`;
        }
        try {
          await this.telegramService.sendPhoto(
            job.data.chatId,
            imageSrc[1],
            caption
          );
          done();
        } catch (error) {
          pauseQueue(error)
        }
      } else {
        if(feedItem.creator) {
          caption += `\nBy ${feedItem.creator}`;
        }
        caption = "No valid image\n" + caption;
        try {
          await this.telegramService.sendTitle(
            job.data.chatId,
            caption
          );
          done();
        } catch (error) {
          pauseQueue(error);
        }
      }

    } else if(feed_type === "title"){
      if(feedItem.creator) {
        caption += `\nBy ${feedItem.creator}`;
      }
      try {
        await this.telegramService.sendTitle(
          job.data.chatId,
          caption
        );
        done();
      } catch (error) {
        pauseQueue(error);
      }

    } else {
      try {
        await this.telegramService.sendRss(
          job.data.chatId,
          feedItem.link
        );
        done();
      } catch (error) {
        pauseQueue(error);
      }
    }

    //testing if the other functions work...
    //current test: sendTitle
    /*try {
      await this.telegramService.sendTitle(
        job.data.chatId,
        caption
      );
      done();
    } catch (error) {
      pauseQueue(error);
    }*/

    //function to pause redis queue
    //changed it to a function, because it felt redundant and verbose in the code
    async function pauseQueue(error){
      if (error?.response?.error_code === 429) {
        done(new Error(error.response.description));
        this.logger.debug("Pausing queue");
        return await this.messagesQueue.pause();
      }
      console.log(error);
      done(new Error(error));
    };

    

    
  }

  @OnQueueFailed()
  async failedProcess(
    job: Job<{ message: string; chatId: number }>,
    error: Error
  ) {
    this.logger.debug(
      `@OnQueueFailed ${job.id} ${job.attemptsMade} ${job.data.message}`
    );
    console.log(error);
    job.retry();
  }

  @OnQueueStalled()
  async stalled(job: Job<{ message: string; chatId: number }>) {
    this.logger.debug(
      `@OnQueueStalled ${job.id} ${job.attemptsMade} ${job.data.message}`
    );
  }

  @OnGlobalQueuePaused()
  async paused() {
    this.logger.debug("@OnGlobalQueuePaused");
    await new Promise((r) => setTimeout(r, 60000));
    this.messagesQueue.resume();
    this.logger.debug("Resumed Queue");
  }
}
