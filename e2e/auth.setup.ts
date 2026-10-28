import { expect, test as setup } from "@playwright/test";

// Log in once for the whole run (the session route is rate-limited to five
// tries per five minutes, as it should be) and share the cookie.

export const AUTH_FILE = "e2e/.auth/editor.json";
const PASS = process.env.E2E_EDIT_PASSWORD ?? "dev-test-password";

setup("editor session", async ({ page }) => {
  await page.goto("/adventure/book/our-story/unlock?v=2");
  await page.getByLabel("Password buku").fill(PASS);
  await page.getByRole("button", { name: "Buka mode edit" }).click();
  await page.waitForSelector("section[data-page]");
  await expect(page.getByLabel("Tersimpan")).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
