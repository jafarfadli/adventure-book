import { expect, test } from "@playwright/test";

// Phase 5: the shelf, a new volume, the shared wishlist and the map
// (dev copy only; everything created here is removed again).

test("the shelf shows the book; tapping it opens the world", async ({ page }) => {
  await page.goto("/adventure/?v=2");
  const book = page.getByRole("link", { name: /Jafar & Sarah · vol\. 1/ });
  await expect(book).toBeVisible();
  await book.click();
  await expect(page.getByRole("region", { name: /geser untuk membaca/ })).toBeVisible();
});

test("an editor starts a new volume, then removes it while still empty", async ({ page }) => {
  await page.goto("/adventure/?v=2");
  await page.getByRole("button", { name: "Buku baru" }).click();
  await page.getByLabel("Judul buku").fill("Vol Tes E2E");
  await page.getByRole("button", { name: "Buat buku" }).click();
  await page.waitForURL(/\/book\/vol-tes-e2e(-\d+)?\/edit/);
  await expect(page.getByRole("button", { name: "Tambah halaman di sini" })).toBeVisible();
  await page.getByRole("button", { name: "Pengaturan buku" }).click();
  await page.getByRole("button", { name: "Hapus buku kosong" }).click();
  await page.waitForURL(/\/adventure\/?(\?v=2)?$/);
  await expect(page.getByRole("link", { name: /Vol Tes E2E/ })).toHaveCount(0);
});

test("the shared wishlist: add, tick, remove, undo, remove", async ({ page }) => {
  await page.goto("/adventure/wishlist?v=2");
  await page.getByLabel("Wish baru").fill("wish tes e2e");
  await page.getByRole("button", { name: "Tambah wish" }).click();
  const tick = page.getByRole("button", { name: "Sudah: wish tes e2e" });
  await expect(tick).toBeVisible();
  await tick.click();
  await expect(page.getByRole("button", { name: "Belum: wish tes e2e" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Hapus: wish tes e2e" }).click();
  await expect(page.getByText("wish tes e2e")).toHaveCount(0);
  await page.getByRole("button", { name: "Urungkan hapus" }).click();
  await expect(page.getByRole("button", { name: "Belum: wish tes e2e" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Hapus: wish tes e2e" }).click();
  await expect(page.getByText("wish tes e2e")).toHaveCount(0);
});

test("the map pins every geotagged memory and a pin opens its stop", async ({ page }) => {
  await page.goto("/adventure/map?v=2");
  const pins = page.locator(".leaflet-marker-icon");
  await expect(pins.first()).toBeVisible({ timeout: 20_000 });
  expect(await pins.count()).toBeGreaterThan(10);
  await pins.first().click({ force: true });
  await page.waitForURL(/\/book\/our-story\?v=2&p=/);
  await expect(page.getByRole("region", { name: /geser untuk membaca/ })).toBeVisible();
});
