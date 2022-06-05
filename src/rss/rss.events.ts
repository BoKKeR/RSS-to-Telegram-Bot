export interface RssEvents {
  pauseAllFeeds: { chatId: number; pause: boolean };
  pauseFeed: { chatId: number; name: string; pause: boolean };
}
