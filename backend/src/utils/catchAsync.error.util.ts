import { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (
  __req: Request,
  __res: Response,
  _next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async function to catch any internal errors and pass them to next()
 * This removes the need for try/catch blocks in controllers.
 */
const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
