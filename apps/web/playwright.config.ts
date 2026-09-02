import { defineConfig } from "@playwright/test";
/** Dev server must already be running (pnpm dev). Override with PLAYWRIGHT_BASE_URL when it sits on another port. */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: 0,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3300", trace: "retain-on-failure", viewport: { width: 1280, height: 900 } },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
