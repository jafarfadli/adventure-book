import { expect, test, type Page } from "@playwright/test";

// The v2 editor against the dev copy (adventure_book_v2dev). Every test puts
// back what it changes. The password is a test-only one set on the copy.

const PASS = process.env.E2E_EDIT_PASSWORD ?? "dev-test-password";
const EDIT = "/adventure/book/our-story/edit?v=2";

test.describe.configure({ mode: "serial" });

async function openEditor(page: Page) {
  await page.goto(EDIT);
  // either the password card (fresh context) or the editor itself
  await page.waitForSelector('section[data-page], input[aria-label="Password buku"]');
  const pw = page.getByLabel("Password buku");
  if (await pw.count()) {
    await pw.fill(PASS);
    await page.getByRole("button", { name: "Buka mode edit" }).click();
  }
  await page.waitForSelector("section[data-page]");
}

const saved = (page: Page) => expect(page.getByLabel("Tersimpan")).toBeVisible({ timeout: 15_000 });
const stops = (page: Page) => page.locator("section[data-page]");

test("unlock, type a caption in place, it survives a reload, then put it back", async ({ page }) => {
  await openEditor(page);
  const cap = stops(page).first().locator("[data-caption]").first();
  const before = (await cap.textContent()) ?? "";
  await cap.click();
  const input = page.getByRole("textbox", { name: "Caption" });
  await input.fill("tes e2e");
  await input.press("Enter");
  await saved(page);
  await page.reload();
  await page.waitForSelector("section[data-page]");
  await expect(stops(page).first().locator("[data-caption]").first()).toHaveText("tes e2e");
  await stops(page).first().locator("[data-caption]").first().click();
  await page.getByRole("textbox", { name: "Caption" }).fill(before);
  await page.getByRole("textbox", { name: "Caption" }).press("Enter");
  await saved(page);
});

test("undo puts an edit back", async ({ page }) => {
  await openEditor(page);
  const cap = stops(page).nth(1).locator("[data-caption]").first();
  const before = (await cap.textContent()) ?? "";
  await cap.click();
  await page.getByRole("textbox", { name: "Caption" }).fill("sebentar saja");
  await page.getByRole("textbox", { name: "Caption" }).press("Enter");
  await saved(page);
  await page.getByRole("button", { name: "Urungkan" }).click();
  await expect(cap).toHaveText(before);
  await saved(page);
  await page.reload();
  await page.waitForSelector("section[data-page]");
  await expect(stops(page).nth(1).locator("[data-caption]").first()).toHaveText(before);
});

test("stop tools: shuffle decorations and switch template, both undoable", async ({ page }) => {
  await openEditor(page);
  const stop = stops(page).first();
  await stop.click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole("toolbar", { name: "Aksi" })).toBeVisible();
  const decor = () => stop.locator("svg.pointer-events-none").evaluateAll((els) => els.map((e) => e.innerHTML.length).join(","));
  const d0 = await decor();
  await page.getByRole("button", { name: "Acak dekorasi" }).click();
  await expect.poll(decor).not.toBe(d0);
  await page.getByRole("button", { name: "Urungkan" }).click();
  await expect.poll(decor).toBe(d0);

  await page.getByRole("button", { name: "Template" }).click();
  await page.getByRole("button", { name: "Satu foto lebar" }).click();
  await saved(page);
  await page.getByRole("button", { name: "Urungkan" }).click();
  await saved(page);
});

test("add an empty stop with ＋, delete it, undo the delete, delete again", async ({ page }) => {
  await openEditor(page);
  const n = await stops(page).count();
  await page.getByRole("button", { name: "Tambah halaman di sini" }).first().click();
  await page.getByRole("button", { name: "Kutipan" }).click();
  await expect(stops(page)).toHaveCount(n + 1);
  await saved(page);
  await page.getByRole("button", { name: "Hapus halaman" }).click();
  await expect(stops(page)).toHaveCount(n);
  await saved(page);
  await page.getByRole("button", { name: "Urungkan" }).click();
  await expect(stops(page)).toHaveCount(n + 1, { timeout: 15_000 });
  await saved(page);
  // clean up: the restored stop is the first one
  await stops(page).first().click({ position: { x: 8, y: 8 } });
  await page.getByRole("button", { name: "Hapus halaman" }).click();
  await expect(stops(page)).toHaveCount(n);
  await saved(page);
});

test("all pages: real-render tiles, tap to jump back", async ({ page }) => {
  await openEditor(page);
  const n = await stops(page).count();
  await page.getByRole("button", { name: "Semua halaman" }).click();
  const grid = page.getByRole("dialog", { name: "Semua halaman" });
  await expect(grid.getByRole("button", { name: /^Halaman \d+$/ })).toHaveCount(n);
  await grid.getByRole("button", { name: "Halaman 5" }).click();
  await expect(grid).toBeHidden();
});
