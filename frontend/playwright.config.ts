import { defineConfig } from "@playwright/test";

/**
 * API-focused checks (no browser). Start backend: `cd backend && uv run python -m uvicorn ...`
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_API_URL ?? "http://127.0.0.1:8000",
    extraHTTPHeaders: { Accept: "application/json" },
  },
});
