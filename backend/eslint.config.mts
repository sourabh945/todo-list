import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  // 1. Global Ignores (Replaces .eslintignore)
  {
    ignores: ["dist/**", "node_modules/**", "logs/**", "coverage/**"],
  },

  // 2. Base Configuration for JS and TS files
  {
    files: ["**/*.{ts,mts,cts,js,mjs,cjs}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked, // Hardcore type checking
      ...tseslint.configs.stylisticTypeChecked, // Enforces clean code style
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true, // Auto-finds your tsconfig.json
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- The "Underscore Fix" for your RequestHandlers ---
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_[^_]",
          varsIgnorePattern: "^_[^-]",
          caughtErrorsIgnorePattern: "^_[^_]",
        },
      ],

      // --- Backend Logic Safety ---
      "no-console": "off", // Keep it off for your logger
      "@typescript-eslint/no-explicit-any": "warn", // Avoid 'any' like the plague
      "@typescript-eslint/await-thenable": "error", // Catches forgotten 'await'
      "@typescript-eslint/no-floating-promises": "error", // Ensures all async code is handled

      // --- Formatting (Optional but recommended) ---
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
    },
  },
);
