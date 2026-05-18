import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  reporter: "html",
  webServer: {
    command: `corepack pnpm exec firebase emulators:exec --only auth,firestore "next dev --hostname 127.0.0.1 --port ${port}"`,
    url: baseURL,
    reuseExistingServer: true,
    gracefulShutdown: { signal: "SIGINT", timeout: 5000 },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
