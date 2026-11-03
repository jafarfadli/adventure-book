import { writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

/**
 * Share of pixels that differ visibly (any channel off by more than 40/255).
 * GPU vs CPU image resampling can nudge a few channel values by ~1–26; a real
 * difference in what is drawn (a missing label, a moved frame) is far louder.
 */
async function visibleDiff(a: Buffer, b: Buffer): Promise<number> {
  const A = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return 1;
  let n = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    if (Math.abs(A.data[i] - B.data[i]) > 40 || Math.abs(A.data[i + 1] - B.data[i + 1]) > 40 || Math.abs(A.data[i + 2] - B.data[i + 2]) > 40) n++;
  }
  return n / (A.info.width * A.info.height);
}

// "The preview must be exactly the real thing": the same stop rendered by the
// reader and by the editor (nothing selected) must produce identical pixels.
// Scenery moves with parallax, so only the stop's own layer is compared, on a
// plain background.

const ISOLATE = `
  [role="region"] { background: #ffffff !important; }
  [role="region"] > div > div[aria-hidden] { display: none !important; }
  .z-30, .z-40, [role="toolbar"] { display: none !important; }
  [aria-label="Tambah halaman di sini"] { display: none !important; }
`;

async function stopShot(page: Page, index: number) {
  await page.addStyleTag({ content: ISOLATE });
  const s = page.locator("section[data-page]").nth(index);
  await s.scrollIntoViewIfNeeded();
  // only this stop's photos: far stops are skipped by content-visibility
  await s.evaluate((el) => el.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await s.evaluate((el) =>
    Promise.all(
      Array.from(el.querySelectorAll("img")).map((i) =>
        i.complete ? null : new Promise((r) => i.addEventListener("load", r, { once: true })),
      ),
    ),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return s.screenshot();
}

for (const index of [0, 8, 9, 30]) {
  test(`stop ${index + 1} looks the same in the reader and the editor`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: "e2e/.auth/editor.json" });
    const reader = await ctx.newPage();
    await reader.goto(`/adventure/book/our-story?page=${index}`);
    await reader.waitForSelector("section[data-page]");
    const a = await stopShot(reader, index);

    const editor = await ctx.newPage();
    await editor.goto("/adventure/book/our-story/edit");
    await editor.waitForSelector("section[data-page]");
    const b = await stopShot(editor, index);

    const ratio = await visibleDiff(a, b);
    if (ratio > 0) {
      await test.info().attach("reader", { body: a, contentType: "image/png" });
      await test.info().attach("editor", { body: b, contentType: "image/png" });
      if (process.env.PARITY_OUT) {
        writeFileSync(`${process.env.PARITY_OUT}/stop${index + 1}-reader.png`, a);
        writeFileSync(`${process.env.PARITY_OUT}/stop${index + 1}-editor.png`, b);
      }
    }
    expect(ratio, "reader and editor differ visibly").toBe(0);
    await ctx.close();
  });
}
