import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run every test file sequentially in the same process
    // This prevents OverwriteModelError from Mongoose re-registering models
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/server.ts", "src/types/**"],
    },
  },
});
