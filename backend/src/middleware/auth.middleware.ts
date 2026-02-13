import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import AppError from "../utils/AppError.error.util";
import { verifyToken } from "../utils/token.auth.util";

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
  } catch (error: unknown) {
    // FIX: "Unsafe assignment" fix by checking type of error
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        error instanceof Error ? error.message : "Internal Error",
        "AUTH_ERR",
        500,
      ),
    );
  }
};

export default middleware;
