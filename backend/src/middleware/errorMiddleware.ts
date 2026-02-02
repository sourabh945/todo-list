// this file containst the middleware for send response in case of a error
//
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  if (err.name == "ValidationError") statusCode = 400;
  const externalMessage =
    err instanceof AppError ? err.externalMessage : "Internal Server Error";
  req.log.error({
    message: err.message,
    ip: req.ip,
    url: req.url,
    method: req.method,
  });
  res.status(statusCode).json({
    status: "error",
    message: externalMessage,
    ...(process.env.NODE_ENV == "development" && { stack: err.stack }),
  });
};

export default globalErrorHandler;
