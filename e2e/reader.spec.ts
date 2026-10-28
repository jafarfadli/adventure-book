import { expect, test, type Page } from "@playwright/test";

// The v2 world reader against the dev copy of the book.

const BOOK = "/adventure/book/our-story?v=2";

async function region(page: Page) {
  const r = page.getByRole("region", { name: /geser untuk membaca/ });
  await expect(r).toBeVisible();
  await page.waitForSelector("section[data-page]");
  return r;
}

const scrollX = (page: Page) => page.getByRole("region", { name: /geser untuk membaca/ }).evaluate((el) => el.scrollLeft);

test("the shut cover opens into the world, once per session", async ({ page }) => {
  await page.goto(BOOK);
  const cover = page.getByRole("button", { name: "Buka buku" });
  await expect(cover).toBeVisible();
  await cover.click();
  await expect(cover).toBeHidden({ timeout: 3000 });
  await region(page);
  // the start sign is just the title and when it began
  await expect(page.getByText("dimulai", { exact: false }).first()).toBeVisible();
  await expect(page.getByText(/Buku ini milik|vol\. \d/)).toHaveCount(0);
  await page.reload();
  await region(page);
  await expect(page.getByRole("button", { name: "Buka buku" })).toHaveCount(0);
});

test("a deep link skips the cover and starts at that stop", async ({ page }) => {
  await page.goto(`${BOOK}&page=8`);
  await region(page);
  await expect(page.getByRole("button", { name: "Buka buku" })).toHaveCount(0);
  expect(await scrollX(page)).toBeGreaterThan(500);
});

test("arrow keys travel stop to stop and the far layer drifts slower", async ({ page }) => {
  await page.goto(`${BOOK}&page=3`);
  const r = await region(page);
  const before = await scrollX(page);
  await r.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scrollX(page)).toBeGreaterThan(before + 100);
  // parallax: the sky layer is translated by a fraction of the scroll
  const t = await page.locator('[aria-hidden="true"][style*="will-change: transform"]').first().evaluate((el) => getComputedStyle(el).transform);
  expect(t).not.toBe("none");
});

test("every stop of the book is on the path", async ({ page }) => {
  await page.goto(`${BOOK}&page=3`);
  await region(page);
  await expect(page.locator("section[data-page]")).toHaveCount(31);
});
