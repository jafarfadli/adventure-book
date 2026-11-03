import { expect, test } from "@playwright/test";

// Phase 5: the shelf, a new book, editing from the shelf, the shared
// wishlist and the map (dev copy only; everything changed here is put back).

test("the shelf shows the book; tapping it opens the world", async ({ page }) => {
  await page.goto("/adventure/");
  const book = page.getByRole("link", { name: "Jafar & Sarah", exact: true });
  await expect(book).toBeVisible();
  await book.click();
  await expect(page.getByRole("region", { name: /geser untuk membaca/ })).toBeVisible();
});

test("an editor starts a new book, then removes it while still empty", async ({ page }) => {
  await page.goto("/adventure/");
  await page.getByRole("button", { name: "Buku baru" }).click();
  await page.getByLabel("Judul buku").fill("Vol Tes E2E");
  await page.getByRole("button", { name: "Buat buku" }).click();
  await page.waitForURL(/\/book\/vol-tes-e2e(-\d+)?\/edit/);
  await expect(page.getByRole("button", { name: "Tambah halaman di sini" })).toBeVisible();
  await page.getByRole("button", { name: "Pengaturan buku" }).click();
  await page.getByRole("button", { name: "Hapus buku kosong" }).click();
  await page.waitForURL(/\/adventure\/?$/);
  await expect(page.getByRole("link", { name: /Vol Tes E2E/ })).toHaveCount(0);
});

test("an editor renames the shelf in place, then puts the name back", async ({ page }) => {
  await page.goto("/adventure/");
  const card = page.getByRole("button", { name: /ubah judul rak/ });
  const before = ((await card.textContent()) ?? "").trim();
  await card.click();
  await page.getByLabel("Judul rak").fill("Rak Tes E2E");
  await page.getByLabel("Judul rak").press("Enter");
  await expect(page.getByRole("heading", { name: /Rak Tes E2E/ })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("heading", { name: /Rak Tes E2E/ })).toBeVisible();
  await expect(page).toHaveTitle("Rak Tes E2E");

  await page.getByRole("button", { name: /ubah judul rak/ }).click();
  await page.getByLabel("Judul rak").fill(before);
  await page.getByLabel("Judul rak").press("Enter");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("heading", { name: new RegExp(before) })).toBeVisible();
});

test("an editor changes a book's title from the shelf, then puts it back", async ({ page }) => {
  await page.goto("/adventure/");
  await page.getByRole("button", { name: "Ubah Jafar & Sarah" }).click();
  await page.getByLabel("Judul buku").fill("Judul Tes E2E");
  await page.getByLabel("Judul buku").press("Tab");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Judul Tes E2E", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Judul Tes E2E", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ubah Judul Tes E2E" }).click();
  await page.getByLabel("Judul buku").fill("Jafar & Sarah");
  await page.getByLabel("Judul buku").press("Tab");
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("link", { name: "Jafar & Sarah", exact: true })).toBeVisible();
});

test("the shared wishlist: add, tick, remove, undo, remove", async ({ page }) => {
  await page.goto("/adventure/wishlist");
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
  await page.goto("/adventure/map");
  const pins = page.locator(".leaflet-marker-icon");
  await expect(pins.first()).toBeVisible({ timeout: 20_000 });
  expect(await pins.count()).toBeGreaterThan(10);
  await pins.first().click({ force: true });
  await page.waitForURL(/\/book\/our-story\?p=/);
  await expect(page.getByRole("region", { name: /geser untuk membaca/ })).toBeVisible();
});
