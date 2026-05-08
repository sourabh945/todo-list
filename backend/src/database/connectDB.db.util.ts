import mongoose from "mongoose";
import logger from "../utils/logger.global.util.js";

class DatabaseManager {
  private readonly mongoURL: string;
  private readonly retryPeriod = 30000; // max retry period 30 sec
  private shutdownTimer: NodeJS.Timeout | null = null;
  private onCriticalFailure: () => void;

  // options for mongodb setup
  private readonly serverSelectionTimeoutMS = 5000;
  private readonly bufferCommand = true;

  constructor(URL: string, shutdownCallback: () => void) {
    this.mongoURL = URL;
    this.onCriticalFailure = shutdownCallback;
    this.setupEventListners();
  }

  //event listner for different occasions
  private setupEventListners(): void {
    //logging every runtime mongodb error
    mongoose.connection.on("error", (err: Error) => {
      logger.error(`[Running] [Fail] [MongoDB] error: ${err}`);
    });

    //logger the success of the connection
    mongoose.connection.on("connected", () => {
      logger.info("[Start] [Success] [MongoDB] Connected");
    });

    //logger for disconnection of the connection and stop if unable to reconnect
    mongoose.connection.on("disconnected", () => {
      logger.warn("[Running] [Warning] [MongoDB] disconnected");
      logger.warn(
        `[Running] [Attempt] [MongoDB] Trying to reconnect and if unable to reconnect server is shutdown in ${this.retryPeriod / 1000} seconds.`,
      );
      this.shutdownTimer = setTimeout(() => {
        logger.error(
          `[Running] [Fail] [MongoDB] unable to reconnect in ${this.retryPeriod / 1000}seconds, shutting down the server.`,
        );
        this.onCriticalFailure();
      }, this.retryPeriod);
    });

    //logger for reconnect and remove the timer
    mongoose.connection.on("reconnected", () => {
      logger.info("[Running] [Success] [MongoDB] reconnected");
      clearTimeout(this.shutdownTimer!);
    });
  }

  public async connect(): Promise<boolean> {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds

    logger.info("[Start] [Running] [MongoDB] connecting...");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await mongoose.connect(this.mongoURL, {
          serverSelectionTimeoutMS: this.serverSelectionTimeoutMS,
          bufferCommands: this.bufferCommand,
        });
        return true;
      } catch (error) {
        logger.error(
          `[Start] [Fail] [MongoDB] connection attempt ${attempt}/${maxRetries} failed: ${error as string}`,
        );

        if (attempt === maxRetries) {
          logger.error(
            "[Start] [Fail] [MongoDB] all connection attempts exhausted",
          );
          return false;
        }

        logger.info(
          `[Start] [Info] [MongoDB] retrying in ${retryDelay / 1000} seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  }
}

export default DatabaseManager;
