import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectEventEmitter } from "nest-emitter";
import { EventEmitterType } from "../events";
import { RssService } from "./rss.service";

@Injectable()
export class RssEventHandler implements OnModuleInit {
  constructor(
    @InjectEventEmitter() private readonly emitter: EventEmitterType,
    private readonly rssService: RssService
  ) {}

  onModuleInit() {
    this.emitter.on("disableAllFeeds", async (dto) => {
      return await this.rssService.disableAllFeeds(dto);
    });

    this.emitter.on("disableFeed", async (dto) => {
      return await this.rssService.disableFeed(dto);
    });
  }
}
