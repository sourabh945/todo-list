// this file contain the custom error class for the app
//

export default class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly externalMessage: string;

  constructor(
    message: string,
    externalMessage: string,
    httpStatusCode: number,
  ) {
    super(message);
    this.statusCode = httpStatusCode;
    this.externalMessage = externalMessage;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
