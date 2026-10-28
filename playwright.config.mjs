// playwright.config.mjs — Casey's browser suite (dev-only tooling; the artifact stays buildless).
import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30000,
  use: {
    viewport: { width: 1280, height: 800 },
    consoleMessageFilter: () => true, // collect everything; tests assert on errors
  },
  webServer: {
    command: "python3 -m http.server 8931",
    port: 8931,
    reuseExistingServer: true, // dev server may already be running
  },
});
