import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { testTimeout: 30_000, hookTimeout: 30_000, environment: "node", include: ["src/**/*.test.ts"] },
});
