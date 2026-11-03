import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

// "Add many photos" end to end: pick three photos at one ＋, review the stop
// the app proposes, create it, then remove it again (dev copy only).

/** Synthetic photos (never real ones in the repo): two portrait, one landscape. */
async function makePhotos(dir: string): Promise<string[]> {
  mkdirSync(dir, { recursive: true });
  const specs = [
    { name: "a.jpg", w: 1200, h: 1600, c: { r: 214, g: 104, b: 138 } },
    { name: "b.jpg", w: 1600, h: 1200, c: { r: 127, g: 174, b: 154 } },
    { name: "c.jpg", w: 1200, h: 1600, c: { r: 240, g: 193, b: 89 } },
  ];
  const out: string[] = [];
  for (const s of specs) {
    const file = path.join(dir, s.name);
    await sharp({ create: { width: s.w, height: s.h, channels: 3, background: s.c } }).jpeg({ quality: 80 }).toFile(file);
    out.push(file);
  }
  return out;
}

test("three photos become one reviewed stop, created in one go", async ({ page }) => {
  await page.goto("/adventure/book/our-story/edit");
  await page.waitForSelector("section[data-page]");
  const stops = page.locator("section[data-page]");
  const n = await stops.count();

  await page.getByRole("button", { name: "Tambah halaman di sini" }).first().click();
  const files = await makePhotos(test.info().outputPath("photos"));
  await page.locator('input[type="file"][multiple]').setInputFiles(files);

  // review: one stop with a template glyph, then the check with its count
  const create = page.getByRole("button", { name: /^Tambahkan \d+ halaman$/ });
  await expect(create).toBeVisible({ timeout: 60_000 });
  await expect(create).toHaveAccessibleName("Tambahkan 1 halaman");
  await create.click();
  await expect(stops).toHaveCount(n + 1, { timeout: 20_000 });
  await expect(page.getByLabel("Tersimpan")).toBeVisible({ timeout: 15_000 });

  // clean up: the new stop is selected after creation
  await page.getByRole("button", { name: "Hapus halaman" }).click();
  await expect(stops).toHaveCount(n);
  await expect(page.getByLabel("Tersimpan")).toBeVisible({ timeout: 15_000 });
});
