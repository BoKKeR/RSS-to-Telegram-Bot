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
import { getLogger } from "src/winston";

const winston = getLogger();

@Processor(constants.queue.messages)
export class TelegramProcessor {
  constructor(
    private logger: CustomLoggerService,
    private readonly telegramService: TelegramService,
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue
  ) {}

  @Process("message")
  async processName(
    job: Job<{ feedItem: Item; chatId: number }>,
    done: DoneCallback
  ) {
    winston.debug(
      `@Process id:${job.id} attempts:${job.attemptsMade} message:${job.data.feedItem.link}`
    );

    try {
      await this.telegramService.sendRss(
        job.data.chatId,
        job.data.feedItem.link
      );
      done();
    } catch (error) {
      winston.error(error);

      if (error?.response?.error_code === 429) {
        done(new Error(error.response.description));
        winston.debug("Pausing queue");
        return await this.messagesQueue.pause();
      }
      winston.error(error);
      done(new Error(error));
    }
  }

  @Process("__default__")
  async proccessDefault(
    job: Job<{ feedItem: Item; chatId: number }>,
    done: DoneCallback
  ) {
    console.log(JSON.stringify(job));
    done();
  }

  @OnQueueFailed()
  async failedProcess(
    job: Job<{ message: string; chatId: number }>,
    error: Error
  ) {
    winston.debug(
      `@OnQueueFailed ${job.id} ${job.attemptsMade} ${job.data.message}`
    );
    winston.error(error);
    job.retry();
  }

  @OnQueueStalled()
  async stalled(job: Job<{ message: string; chatId: number }>) {
    winston.debug(
      `@OnQueueStalled ${job.id} ${job.attemptsMade} ${job.data.message}`
    );
  }

  @OnGlobalQueuePaused()
  async paused() {
    winston.debug("@OnGlobalQueuePaused");
    await new Promise((r) => setTimeout(r, 60000));
    this.messagesQueue.resume();
    winston.debug("Resumed Queue");
  }
}
