import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3847",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3847,
    reuseExistingServer: !process.env.CI,
  },
});
