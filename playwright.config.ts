import { defineConfig } from "@playwright/test";

// Runs against the v2 dev server (`next dev -p 3012`), which points at the
// adventure_book_v2dev copy — never at the live database. Uses the system
// Chrome so no browser download is needed.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  use: {
    channel: "chrome",
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3012",
  },
  projects: [
    { name: "phone", use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
