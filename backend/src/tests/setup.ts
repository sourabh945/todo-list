import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach, vi } from "vitest";

// ── Mock pino logger BEFORE any app module is imported ───────────────────────
vi.mock("../utils/logger.global.util.js", () => {
  const mockLogger: Record<string, unknown> = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    levels: {
      values: {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60,
        silent: Infinity,
      },
      labels: {
        10: "trace",
        20: "debug",
        30: "info",
        40: "warn",
        50: "error",
        60: "fatal",
      },
    },
    child: vi.fn(function () {
      return mockLogger;
    }),
    isLevelEnabled: vi.fn(() => false),
  };
  return { default: mockLogger };
});

// ── In-memory MongoDB ─────────────────────────────────────────────────────────
let mongod: MongoMemoryServer;

beforeAll(async () => {
  // If already connected (shared process), skip reconnecting
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  // Only disconnect in the very last suite — handled by vitest lifecycle
  // Leaving connection open across suites avoids reconnect overhead
});
