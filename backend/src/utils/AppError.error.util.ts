// this file contain the custom error class for the app
//

import logger from "./logger.global.util.js";

export default class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly externalMessage: string;
  public readonly critical: boolean;

  constructor(
    message: string,
    externalMessage: string,
    httpStatusCode: number,
    critical = false,
  ) {
    super(message);
    this.statusCode = httpStatusCode;
    this.externalMessage = externalMessage;
    this.isOperational = true;
    this.critical = critical;
    Error.captureStackTrace(this, this.constructor);
    this.actionOnCriticalError();
  }

  private actionOnCriticalError(): void {
    if (this.critical) {
      logger.error(`\n[Critical Error] Error: ${this.message}\n`);
      logger.info("Process Terminated due to the error");
      process.exit(1);
    }
  }
}
