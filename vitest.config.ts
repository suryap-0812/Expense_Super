import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@expense-tracker/domain": path.resolve(__dirname, "./packages/domain/src"),
      "@expense-tracker/schemas": path.resolve(__dirname, "./packages/schemas/src"),
      "@expense-tracker/state": path.resolve(__dirname, "./packages/state/src"),
      "@expense-tracker/analytics": path.resolve(__dirname, "./packages/analytics/src"),
      "@expense-tracker/ml-contract": path.resolve(__dirname, "./packages/ml-contract/src"),
      "@expense-tracker/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@expense-tracker/utils": path.resolve(__dirname, "./packages/utils/src"),
    },
  },
});
