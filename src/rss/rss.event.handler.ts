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
    this.emitter.on("enableAllFeeds", async (dto) => {
      return await this.rssService.enableAllFeeds(dto);
    });

    this.emitter.on("enableFeed", async (dto) => {
      return await this.rssService.enableFeed(dto);
    });
  }
}
