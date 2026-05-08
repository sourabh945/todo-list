import mongoose from "mongoose";
import AppError from "../utils/AppError.error.util.js";

type MongoDuplicateKeyError = mongoose.mongo.MongoServerError & {
  code: 11000;
  keyValue: Record<string, string>;
};

const isDuplicateKeyError = (
  err: mongoose.Error | Error,
): err is MongoDuplicateKeyError => {
  return err instanceof mongoose.mongo.MongoServerError && err.code === 11000;
};

export type ErrorType = mongoose.Error | Error;

export const ModelErrorHandler = (
  err: mongoose.Error | Error,
): AppError | Error => {
  // 1. Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((el) => el.message);

    return new AppError(
      err.message,
      `Invalid input data: ${messages.join(", ")}`,
      400,
    );
  }

  // 2. Duplicate Key Error
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue)[0];

    return new AppError(
      err.message,
      `Duplicate value for "${field}". Please use another value.`,
      400,
    );
  }

  // 3. Cast Error
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(err.message, `Invalid value for "${err.path}".`, 400);
  }

  // 4. Fallback
  return new Error(err.message);
};
