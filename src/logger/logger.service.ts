import { Injectable, Scope, ConsoleLogger } from "@nestjs/common";

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  customLog() {
    this.log("test!");
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.DEBUG === "true") {
      super.debug(message, ...optionalParams);
    }
  }
}
