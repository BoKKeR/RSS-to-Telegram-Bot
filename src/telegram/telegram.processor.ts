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

@Processor(constants.queue.messages)
export class TelegramProcessor {
  constructor(
    private logger: CustomLoggerService,
    private readonly telegramService: TelegramService,
    @InjectQueue(constants.queue.messages) private messagesQueue: Queue
  ) {}

  @Process("message")
  async processName(
    job: Job<{ message: string; chatId: number }>,
    done: DoneCallback
  ) {
    this.logger.debug(
      `@Process id:${job.id} attempts:${job.attemptsMade} message:${job.data.message}`
    );

    try {
      await this.telegramService.sendRss(job.data.chatId, job.data.message);
      done();
    } catch (error) {
      if (error?.response?.error_code === 429) {
        done(new Error(error.response.parameters.description));
        this.logger.debug("Pausing queue");
        return await this.messagesQueue.pause();
      }
      console.log(error);
      done(new Error(error));
    }
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
