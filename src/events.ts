import { EventEmitter } from "events";
import { StrictEventEmitter } from "nest-emitter";
import { RssEvents } from "./rss/rss.events";

// import and add events to the AppEvents type
type AppEvents = RssEvents;

export type EventEmitterType = StrictEventEmitter<EventEmitter, AppEvents>;
