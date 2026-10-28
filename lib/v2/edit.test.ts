import { describe, expect, test } from "vitest";
import {
  bookPrev,
  insertPages,
  patchBook,
  patchSlot,
  removePage,
  reorderPages,
  setPageSeed,
  setPageTemplate,
  setPageTheme,
  slotPrev,
} from "./edit";
import { emptySlot, type BookV2, type PageV2 } from "./types";

function page(id: string, template: PageV2["template"] = "single-tall"): PageV2 {
  return {
    id,
    order: 0,
    template,
    theme: "stroberi",
    ownTheme: null,
    decorSeed: 0,
    slots: { photo1: { ...emptySlot("photo1", "PHOTO"), caption: `cap-${id}` } },
  };
}

const book = (): BookV2 => ({
  id: "b",
  slug: "s",
  title: "T",
  subtitle: null,
  volume: 1,
  theme: "stroberi",
  coverImageUrl: null,
  coverFocusX: 0.5,
  coverFocusY: 0.5,
  coverText: null,
  closingText: null,
  pages: [page("a"), page("b"), page("c")],
  stats: { stops: 3, media: 0, first: null, last: null },
  wishlistTop: [],
});

describe("slot edits", () => {
  test("patching is immutable and creates missing slots", () => {
    const b0 = book();
    const b1 = patchSlot(b0, "a", "photo1", { caption: "baru" });
    expect(b1.pages[0].slots.photo1.caption).toBe("baru");
    expect(b0.pages[0].slots.photo1.caption).toBe("cap-a");
    const b2 = patchSlot(b1, "a", "text1", { text: "halo" });
    expect(b2.pages[0].slots.text1.text).toBe("halo");
    expect(b2.pages[0].slots.text1.type).toBe("TEXT");
  });

  test("the previous values are exactly the patched fields", () => {
    expect(slotPrev(book(), "a", "photo1", { caption: "x", focusX: 0.2 })).toEqual({ caption: "cap-a", focusX: 0.5 });
    expect(slotPrev(book(), "a", "text1", { text: "x" })).toEqual({ text: null });
  });
});

describe("page edits", () => {
  test("a template switch keeps the slots and adds the new ones", () => {
    const b = setPageTemplate(book(), "a", "photo-text");
    expect(b.pages[0].template).toBe("photo-text");
    expect(b.pages[0].slots.photo1.caption).toBe("cap-a");
    expect(b.pages[0].slots.text1).toBeDefined();
  });

  test("a page theme overrides; null follows the book again", () => {
    let b = setPageTheme(book(), "b", "laut");
    expect(b.pages[1]).toMatchObject({ theme: "laut", ownTheme: "laut" });
    b = setPageTheme(b, "b", null);
    expect(b.pages[1]).toMatchObject({ theme: "stroberi", ownTheme: null });
  });

  test("shuffling sets the decoration seed", () => {
    expect(setPageSeed(book(), "c", 7).pages[2].decorSeed).toBe(7);
  });

  test("insert, remove and reorder keep the rest intact", () => {
    let b = insertPages(book(), 1, [page("x"), page("y")]);
    expect(b.pages.map((p) => p.id)).toEqual(["a", "x", "y", "b", "c"]);
    const r = removePage(b, "y");
    expect(r.index).toBe(2);
    expect(r.page.id).toBe("y");
    b = r.book;
    expect(b.pages.map((p) => p.id)).toEqual(["a", "x", "b", "c"]);
    b = reorderPages(b, ["c", "a", "x", "b"]);
    expect(b.pages.map((p) => p.id)).toEqual(["c", "a", "x", "b"]);
    expect(b.stats.stops).toBe(4);
  });

  test("reorder refuses a list that does not match", () => {
    expect(() => reorderPages(book(), ["a", "b"])).toThrow();
  });
});

describe("book edits", () => {
  test("changing the book theme moves pages that follow it, not pages with their own", () => {
    let b = setPageTheme(book(), "a", "senja");
    b = patchBook(b, { theme: "matcha" });
    expect(b.pages.map((p) => p.theme)).toEqual(["senja", "matcha", "matcha"]);
  });

  test("previous book values for undo", () => {
    expect(bookPrev(book(), { title: "Baru", closingText: "x" })).toEqual({ title: "T", closingText: null });
  });
});
