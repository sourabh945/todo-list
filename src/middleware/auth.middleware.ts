import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import AppError from "../utils/AppError.error.util.js";
import { verifyToken } from "../utils/token.auth.util.js";

// Helper should explicitly return string or null
function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization; // Express types this as string | undefined
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

const middleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) throw new AppError("Missing Token", "Missing token", 401);

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      throw new AppError("Invalid Token Payload", "Invalid token", 401);
    }

    // Now req.user is recognized due to the global augmentation above
    req.user = {
      id: new Types.ObjectId(decoded.id),
      username: decoded.username,
    };

    next();
  } catch (err: unknown) {
    // FIX: "Unsafe assignment" fix by checking type of error
    if (err instanceof AppError) {
      return next(err);
    }
    if (err instanceof Error && err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", "Invalid token", 401));
    }
    if (err instanceof Error && err.name === "TokenExpiredError") {
      return next(new AppError("Token expired", "Token expired", 401));
    }
    return next(new AppError("Internal Error", "AUTH_ERR", 500));
  }
};

export default middleware;
