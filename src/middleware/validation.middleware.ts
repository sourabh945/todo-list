import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import AppError from "../utils/AppError.error.util.js";

const validate =
  (schema: ZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body as Record<string, unknown>,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Map Zod errors into a readable string for your AppError
        const message = error.issues.map((i) => i.message).join(", ");
        return next(new AppError(message, message, 400));
      }
      next(error);
    }
  };

export default validate;
