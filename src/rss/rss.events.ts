export interface RssEvents {
  enableAllFeeds: { chatId: number; enable: boolean };
  enableFeed: { chatId: number; name: string; enable: boolean };
}
