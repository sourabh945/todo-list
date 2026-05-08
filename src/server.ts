import mongoose from "mongoose";
import http from "http";

// ─── Load Environment Variables ──────────────────────────────────────────────

import "dotenv/config.js";

// ─── Load Logger ──────────────────────────────────────────────────────────────

import logger from "./utils/logger.global.util.js";

// ─── Environment Validation ─────────────────────────────────────────────────

let server: http.Server;
let DB: string | undefined = process.env?.DATABASE_URL;
const ENV: string = process.env?.NODE_ENV ?? "production";
const PORT: number = Number(process.env?.PORT) || 3000;

// ─── Constants ───────────────────────────────────────────────────────────────

const SHUTDOWN_TIMEOUT_MS = 10_000;

// ─── Tags ────────────────────────────────────────────────────────────────────
//
//  [Phase]    → where in the lifecycle we are
//  [Event]    → what happened
//  [Module]   -> which module or component have the error/ optional
//
//  Phase:   Start | Running | Shutdown | Precheck
//  Event:   Done | Fail | Exception | Rejection | SIGTERM | SIGINT | Timeout | Exit
//  Module:  MongoDB | ENV | JWT Auth | App | Server | ...

// ─── Uncaught Exception (sync — unrecoverable) ──────────────────────────────

process.on("uncaughtException", (err: Error) => {
  logger.error(`[Start] [Exception] ${err.name}: ${err.message}`);
  logger.error(`[Start] [Exception] Stack: ${err.stack ?? "N/A"}`);
  process.exit(1);
});

// ─── Graceful Shutdown Helper ────────────────────────────────────────────────

const gracefulShutdown = (
  server: http.Server,
  reason: string,
  exitCode: number,
): void => {
  logger.info(`[Shutdown] [${reason}] Graceful shutdown initiated`);

  // Force kill if shutdown hangs
  const forceKillTimer = setTimeout(() => {
    logger.error(
      `[Shutdown] [Timeout] Could not close in ${String(SHUTDOWN_TIMEOUT_MS)}ms — forcing exit`,
    );
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);

  forceKillTimer.unref();

  server.close(() => {
    logger.info("[Shutdown] [Done] HTTP server closed");

    mongoose.connection
      .close()
      .then(() => {
        logger.info("[Shutdown] [Done] Database connection closed");
        logger.info("[Shutdown] [Exit] Process terminated");
        process.exit(exitCode);
      })
      .catch((err: Error) => {
        logger.error(`[Shutdown] [Fail] Database close error: ${err.message}`);
        process.exit(exitCode);
      });
  });
};

// ─── Utility: extract message from unknown error ─────────────────────────────

const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  return String(err);
};

const toErrorStack = (err: unknown): string | undefined => {
  if (err instanceof Error) return err.stack;
  return undefined;
};

// ─── Prechecks for ENV ─────────────────────────────────────────────────

if (ENV == "production" && DB == undefined) {
  logger.error(
    "[Precheck] [Fail] [ENV] Missing DATABASE_URL environment variable",
  );
  process.exit(1);
}

if (ENV == "development" && DB == undefined) {
  DB = "mongodb://27017/todo-app";
  logger.info("[Precheck] [Pass] [ENV] using a default DB URL");
}

if (DB == undefined) {
  logger.error(
    "[Precheck] [Fail] [ENV] Missing DATABASE_URL environment variable",
  );
  process.exit(1);
}

// ─── bootstrap function loading db and start application and do everything ───────────────────────────────────────────────────────────────

import DatabaseManager from "./database/connectDB.db.util.js";

async function bootstrap() {
  const handleCriticalError = () => {
    if (server) {
      // You'll need to export your gracefulShutdown helper
      gracefulShutdown(server, "DB_FAILURE", 1);
    } else {
      process.exit(1);
    }
  };

  // ─── connecting db ───────────────────────────────────────────────────────────────

  const dbManager = new DatabaseManager(DB!, handleCriticalError);

  try {
    const successStatus = await dbManager.connect();
    if (successStatus) {
      logger.info("[Start] [Pass] [DB] Connected to database");
    } else {
      logger.error("[Start] [Fail] [DB] Failed to connect to database");
      process.exit(1);
    }
  } catch (err: unknown) {
    logger.error(`[Start] [Fail] [DB] ${toErrorMessage(err)}`);
    const stack = toErrorStack(err);
    if (stack) {
      logger.error(`[Start] [Fail] [DB] Stack: ${stack}`);
    }
    process.exit(1);
  }

  // ─── Loading App and start server ───────────────────────────────────────────────────────────────

  const { default: app } = await import("./app.js");

  try {
    server = app.listen(PORT, () => {
      logger.info(`[Server] [Pass] [Server] Server started on port ${PORT}`);
    });
  } catch (err: unknown) {
    logger.error(
      `[Start] [Fail] [Server] Starting failed: ${toErrorMessage(err)}`,
    );

    const stack = toErrorStack(err);
    if (stack) {
      logger.error(`[Start] [Fail] [Server] Stack: ${stack}`);
    }

    process.exit(1);
  }

  setupProcessListners(server);
}
// ─── Process Listners ───────────────────────────────────────────────────────────────

function setupProcessListners(server: http.Server) {
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(`[Running] [Rejection] [Server] ${toErrorMessage(reason)}`);

    const stack = toErrorStack(reason);
    if (stack) {
      logger.error(`[Running] [Rejection] [Server] Stack: ${stack}`);
    }

    gracefulShutdown(server, "Rejection", 1);
  });

  // 6. SIGTERM (Docker / orchestrator stop)
  process.on("SIGTERM", () => {
    gracefulShutdown(server, "SIGTERM", 0);
  });

  // 7. SIGINT (Ctrl+C)
  process.on("SIGINT", () => {
    gracefulShutdown(server, "SIGINT", 0);
  });
}

(async () => {
  await bootstrap();
})().catch((err) => {
  logger.error(`[Start] [Fail] [Server] ${toErrorMessage(err)}`);
  const stack = toErrorStack(err);
  if (stack) {
    logger.error(`[Start] [Fail] [Server] Stack: ${stack}`);
  }
  process.exit(1);
});
