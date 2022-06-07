export interface RssEvents {
  disableAllFeeds: { chatId: number; disable: boolean };
  disableFeed: { chatId: number; name: string; disable: boolean };
}
