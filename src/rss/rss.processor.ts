import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueStalled,
  OnGlobalQueuePaused,
  InjectQueue
} from "@nestjs/bull";
import { DoneCallback, FailedEventCallback, Job, Queue } from "bull";
import constants from "src/util/constants";

import { RssService } from "./rss.service";
import { getLogger } from "src/winston";
import { rss } from "@prisma/client";

const winston = getLogger();

@Processor(constants.queue.repeatableFeed)
export class RssProcessor {
  constructor(
    private readonly rssService: RssService,
    @InjectQueue(constants.queue.repeatableFeed)
    private repeatableFeedQueue: Queue
  ) {}

  @Process("feed")
  async processName(
    job: Job<rss>,
    done: DoneCallback,
    fail: FailedEventCallback
  ) {
    winston.debug(
      `@RepeatableProcess id:${job.id} attempts:${job.attemptsMade} feedlink:${job.data.link}`
    );

    try {
      await this.rssService.processFeedJob(job.data);
      done();
    } catch (error) {
      winston.error(error);

      if (error?.message === "FEED_FAILURE") {
        fail(job, error.message);
      }
      winston.error(error);
      done(new Error(error));
    }
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
    this.repeatableFeedQueue.resume();
    winston.debug("Resumed Queue");
  }
}
