import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import fs from "fs";
import path from "path";
import AppError from "./AppError.error.util";
import logger from "./logger.global.util";

interface Payload extends Record<string, unknown> {
  id: string;
  username: string;
}

class JWTManager {
  private secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = this.initiationSecret();
    this.expiresIn = `${process.env.JWT_EXPIRES_IN ?? 7}d`;
    logger.info("[Start] [Done] [JWT Auth] Token secret loaded successfully");
    logger.info(
      `[Start] [Done] [JWT Auth] [Show Config] Token expiration time is ${this.expiresIn}`,
    );
  }

  // private methods for tokenManager
  private initiationSecret(): string {
    const envSecret = process.env.JWT_SECRET ?? process.env.JWT_PEM_KEY;
    const nodeEnv = process.env.NODE_ENV ?? "production";

    if (nodeEnv === "production") {
      if (!envSecret) {
        throw new AppError(
          "[Start] [Fail] [JWT Auth] JWT_SECRET must be provided in production environment",
          "",
          0,
          true,
        );
      } else {
        if (this.validateSecretStrength(envSecret)) {
          return envSecret;
        }
      }
    }

    if (!envSecret) {
      logger.warn(
        "[Start] [Warn] [JWT Auth] JWT secret is not provided in development environment as env variable.",
      );
      return this.handleSecretForDev();
    } else {
      return envSecret;
    }
  }

  private handleSecretForDev(): string {
    try {
      const devSecretPath = path.join(process.cwd(), ".jwt-dev-secret");

      if (fs.existsSync(devSecretPath)) {
        logger.info(
          "[Start] [Done] [JWT Auth] Found a temp token in .jwt-dev-secret file",
        );
        return fs.readFileSync(devSecretPath, "utf8");
      } else {
        const secret = crypto.randomBytes(32).toString("hex");
        fs.writeFileSync(devSecretPath, secret);
        logger.info(
          "[Start] [Done] [JWT Auth] Generated a new token in .jwt-dev-secret file",
        );
        return secret;
      }
    } catch (err) {
      logger.error(
        "[Start] [JWT Auth] Failed to generate a new token in .jwt-dev-secret file",
      );
      throw new AppError(err as string, "", 0, true);
    }
  }

  private validateSecretStrength(secret: string): boolean {
    if (secret.length < 32) {
      throw new AppError(
        "[Start] [Fail] [JWT Auth] JWT_SECRET must be at least 32 characters long",
        "",
        0,
        true,
      );
    }
    return true;
  }

  //public methods for jwt manager
  /**
   this method is use for sign the token just pass the id and username data will added by using it
   */

  public signToken<T extends Payload>(payload: T): string {
    try {
      return jwt.sign(payload, this.secret, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresIn: this.expiresIn as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });
    } catch (err) {
      throw new AppError(err as string, "", 500);
    }
  }

  public verifyToken<T extends Payload>(token: string): T {
    try {
      return jwt.verify(token, this.secret) as T;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError("Token expired", "Token expired", 401);
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid token", "Invalid token", 401);
      } else {
        throw new Error(err as string);
      }
    }
  }
}

const jwtManager = new JWTManager();
export const signToken = jwtManager.signToken.bind(jwtManager);
export const verifyToken = jwtManager.verifyToken.bind(jwtManager);
