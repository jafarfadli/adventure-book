import { expect, test } from "@playwright/test";

// Visual lock on the v2 renderer: every template in every theme, rendered by
// the same Station + kit code the book uses. Runs against the dev server and
// the adventure_book_v2dev copy.

const THEMES = ["stroberi", "senja", "matcha", "laut", "lavender"];

for (const theme of THEMES) {
  test(`gallery · ${theme}`, async ({ page }) => {
    await page.goto(`/adventure/dev/gallery?theme=${theme}`);
    await page.waitForLoadState("networkidle");
    // photos are lazy; a full-page snapshot needs all of them, so load them now
    await page.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0));
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(`[data-theme-section="${theme}"] [data-template]`)).toHaveCount(12);
    await expect(page).toHaveScreenshot(`gallery-${theme}.png`, { fullPage: true });
  });
}
