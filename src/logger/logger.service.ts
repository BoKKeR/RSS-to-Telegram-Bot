import { Injectable, Scope, ConsoleLogger } from "@nestjs/common";
import { getLogger } from "src/winston";

const winston = getLogger();

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  debug(message: any, ...optionalParams: any[]) {
    if (process.env.DEBUG === "true") {
      winston.debug(message);
      super.debug(message, ...optionalParams);
    }
  }
}
