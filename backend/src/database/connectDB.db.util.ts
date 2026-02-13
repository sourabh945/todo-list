import mongoose from "mongoose";
import logger from "../utils/logger.global.util.js";

//event listner for different occuation;

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
  logger.info("[Start] [Running] [MongoDB] connecting...");
  try {
    await mongoose.connect(DB);
    return true;
  } catch (error) {
    logger.error(
      `[Running] [Fail] [MongoDB] connection error: ${error as string}`,
    );
    return false;
  }
}
