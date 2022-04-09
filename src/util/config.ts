export const delay = parseInt(process.env.DELAY)
  ? parseInt(process.env.DELAY)
  : 120;

export const chatid = process.env.CHATID;

export const logLevel =
  process.env.DEBUG === "true"
    ? ["error", "warn", "debug", "log"]
    : ["error", "warn", "log"];
