import { version } from "../../package.json";

export const delay = parseInt(process.env.DELAY)
  ? parseInt(process.env.DELAY)
  : 120;

export const chatid = process.env.CHATID && parseInt(process.env.CHATID);
export const adminchatid =
  process.env.ADMIN_CHATID && parseInt(process.env.ADMIN_CHATID);

export const logLevel =
  process.env.DEBUG === "true"
    ? ["error", "warn", "debug", "log"]
    : ["error", "warn", "log"];

export const packageVersion = version ? version : "not_found";
