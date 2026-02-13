import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import AppError from "../utils/AppError.error.util";

// ─── Type for MongoDB duplicate key errors ───────────────────────────────────

interface DuplicateKeyError extends MongoServerError {
  keyValue: Record<string, unknown>;
}

// ─── Type guard ──────────────────────────────────────────────────────────────

const isDuplicateKeyError = (err: Error): err is DuplicateKeyError =>
  err instanceof MongoServerError && err.code === 11000 && "keyValue" in err;

// ─── Mongoose → AppError transformers ────────────────────────────────────────

const handleCastError = (err: mongoose.Error.CastError): AppError =>
  new AppError(err.message, `Invalid value for field "${err.path}"`, 400);

const handleValidationError = (
  err: mongoose.Error.ValidationError,
): AppError => {
  const fields = Object.values(err.errors).map((e) => e.message);
  return new AppError(
    err.message,
    `Validation failed: ${fields.join(". ")}`,
    400,
  );
};

const handleDuplicateKeyError = (err: DuplicateKeyError): AppError => {
  const fields = Object.keys(err.keyValue).join(", ");
  return new AppError(
    err.message,
    `Duplicate value for field(s): ${fields}. Please use another value.`,
    409,
  );
};

const handleDocumentNotFoundError = (
  err: mongoose.Error.DocumentNotFoundError,
): AppError =>
  new AppError(err.message, "No document found with the given query", 404);

const handleVersionError = (err: mongoose.Error.VersionError): AppError =>
  new AppError(
    err.message,
    "Document version conflict. It was modified by another process.",
    409,
  );

const handleParallelSaveError = (
  err: mongoose.Error.ParallelSaveError,
): AppError =>
  new AppError(
    err.message,
    "Cannot save the same document instance in parallel",
    409,
  );

const handleStrictModeError = (err: mongoose.Error.StrictModeError): AppError =>
  new AppError(
    err.message,
    `Field "${err.path}" is not allowed by the schema`,
    400,
  );

const handleMissingSchemaError = (
  err: mongoose.Error.MissingSchemaError,
): AppError => new AppError(err.message, "Internal Server Error", 500);

const handleDivergentArrayError = (
  err: mongoose.Error.DivergentArrayError,
): AppError =>
  new AppError(
    err.message,
    "Array was modified before saving. Reload the document and retry.",
    409,
  );

// ─── Main handler ────────────────────────────────────────────────────────────

const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: Error | AppError = err;

  // ── auto-detect Mongoose / Mongo errors and convert to AppError ─────

  if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if (isDuplicateKeyError(err)) {
    error = handleDuplicateKeyError(err);
  } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
    error = handleDocumentNotFoundError(err);
  } else if (err instanceof mongoose.Error.VersionError) {
    error = handleVersionError(err);
  } else if (err instanceof mongoose.Error.ParallelSaveError) {
    error = handleParallelSaveError(err);
  } else if (err instanceof mongoose.Error.StrictModeError) {
    error = handleStrictModeError(err);
  } else if (err instanceof mongoose.Error.MissingSchemaError) {
    error = handleMissingSchemaError(err);
  } else if (err instanceof mongoose.Error.DivergentArrayError) {
    error = handleDivergentArrayError(err);
  }

  // ── resolve final values ────────────────────────────────────────────

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const externalMessage =
    error instanceof AppError ? error.externalMessage : "Internal Server Error";

  // ── log (always uses raw internal message) ──────────────────────────

  req.log.error({
    message: err.message,
    errorType: err.name,
    ip: req.ip,
    url: req.url,
    method: req.method,
  });

  // ── respond ─────────────────────────────────────────────────────────

  res.status(statusCode).json({
    status: "error",
    message: externalMessage,
    ...(process.env.NODE_ENV === "development" && {
      errorType: err.name,
      internalError: err.message,
      stack: err.stack,
    }),
  });
};

export default globalErrorHandler;
