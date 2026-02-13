import mongoose from "mongoose";
import logger from "../utils/logger.global.util.js";

//event listener for different occasions
mongoose.connection.on("error", (error) => {
  logger.error(`[Running] [Fail] [MongoDB] error: ${error}`);
  process.exit(1);
});

mongoose.connection.on("connected", () => {
  logger.info("[Start] [Success] [MongoDB] connected");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("[Running] [Warning] [MongoDB] disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("[Running] [Success] [MongoDB] reconnected");
});

export default async function connectDB(DB: string): Promise<boolean> {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  logger.info("[Start] [Running] [MongoDB] connecting...");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(DB, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
      return true;
    } catch (error) {
      logger.error(
        `[Running] [Fail] [MongoDB] connection attempt ${attempt}/${maxRetries} failed: ${error as string}`,
      );

      if (attempt === maxRetries) {
        logger.error(
          "[Running] [Fail] [MongoDB] all connection attempts exhausted",
        );
        return false;
      }

      logger.info(
        `[Running] [Info] [MongoDB] retrying in ${retryDelay / 1000} seconds...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
}
