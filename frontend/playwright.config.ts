import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function resolveChromiumExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  const candidate = path.join(
    localAppData,
    "ms-playwright",
    "chromium-1223",
    "chrome-win64",
    "chrome.exe"
  );
  return fs.existsSync(candidate) ? candidate : undefined;
}

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const executablePath = resolveChromiumExecutable();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
