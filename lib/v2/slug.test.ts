import { expect, test } from "vitest";
import { slugify, uniqueSlug } from "./slug";

test("readable, url-safe slugs", () => {
  expect(slugify("Liburan Bali 2027!")).toBe("liburan-bali-2027");
  expect(slugify("  Jafar & Sarah — vol. 2 ")).toBe("jafar-sarah-vol-2");
  expect(slugify("Café Señorita")).toBe("cafe-senorita");
  expect(slugify("♡♡♡")).toBe("buku");
  expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
});

test("taken slugs get a number", () => {
  expect(uniqueSlug("our-story", new Set(["our-story"]))).toBe("our-story-2");
  expect(uniqueSlug("our-story", new Set(["our-story", "our-story-2"]))).toBe("our-story-3");
  expect(uniqueSlug("baru", new Set())).toBe("baru");
});
