import { createLogger, transports, format, Logger } from "winston";
import LokiTransport from "winston-loki";

let logger: Logger;

const initializeLogger = () => {
  if (logger) {
    return;
  }

  const baseTransports: any = [
    new transports.Console({
      format: format.combine(
        format.errors({ stack: true }),
        format.colorize(),
        format.timestamp(),
        format.printf((info) => {
          const { timestamp, level, message, ...args } = info;

          const ts = timestamp.slice(0, 19).replace("T", " ");
          return `${ts} [${level}]: ${message} ${
            Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
          }`;
        })
      )
    })
  ];

  if (process.env.LOKI_HOST && process.env.LOKI_APP) {
    baseTransports.push(
      new LokiTransport({
        host: process.env.LOKI_HOST,
        labels: { app: process.env.LOKI_APP },
        json: true,
        format: format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.error(err)
      })
    );
  }

  logger = createLogger({
    transports: baseTransports
  });

  if (process.env.DEBUG === "true") {
    logger.level = "debug";
  } else {
    logger.level = "info";
  }
};

export const getLogger = () => {
  initializeLogger();
  return logger;
};
