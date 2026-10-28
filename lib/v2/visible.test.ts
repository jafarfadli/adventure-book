import { describe, expect, it } from "vitest";
import { emptySlot, type PageV2 } from "./types";
import { bookStats, hasMedia, pageDate, visibleSlots } from "./visible";

function page(over: Partial<PageV2> = {}): PageV2 {
  return { id: "p", order: 0, template: "single-tall", theme: "stroberi", ownTheme: null, decorSeed: 0, slots: {}, ...over };
}

const photo = (key: string, over: Partial<ReturnType<typeof emptySlot>> = {}) => ({ ...emptySlot(key, "PHOTO"), ...over });

describe("visibleSlots", () => {
  it("keeps only the slots the current template has a place for", () => {
    const p = page({
      template: "single-tall",
      slots: { photo1: photo("photo1", { imageUrl: "/a" }), photo2: photo("photo2", { imageUrl: "/b" }) },
    });
    expect(visibleSlots(p).map((s) => s.key)).toEqual(["photo1"]);
  });

  it("follows the template's own order", () => {
    const p = page({
      template: "photo-text",
      slots: { text1: { ...emptySlot("text1", "TEXT"), text: "hai" }, photo1: photo("photo1") },
    });
    expect(visibleSlots(p).map((s) => s.key)).toEqual(["photo1", "text1"]);
  });
});

describe("hasMedia", () => {
  it("needs the image for a photo and the clip for a video", () => {
    expect(hasMedia(photo("photo1", { imageUrl: "/a" }))).toBe(true);
    expect(hasMedia(photo("photo1"))).toBe(false);
    // a poster alone is not a video
    expect(hasMedia({ ...emptySlot("video1", "VIDEO"), imageUrl: "/poster" })).toBe(false);
    expect(hasMedia({ ...emptySlot("video1", "VIDEO"), videoUrl: "/clip" })).toBe(true);
    expect(hasMedia({ ...emptySlot("text1", "TEXT"), text: "x" })).toBe(false);
  });
});

describe("pageDate", () => {
  it("ignores dates on hidden slots", () => {
    const p = page({
      template: "single-tall",
      slots: { photo1: photo("photo1"), photo2: photo("photo2", { takenAt: "2025-01-05T05:00:00.000Z" }) },
    });
    expect(pageDate(p)).toBeNull();
  });
});

describe("bookStats", () => {
  it("counts only shown media and dates", () => {
    const pages = [
      page({
        id: "a",
        template: "single-tall",
        slots: {
          photo1: photo("photo1", { imageUrl: "/a", takenAt: "2025-02-01T05:00:00.000Z" }),
          photo2: photo("photo2", { imageUrl: "/b", takenAt: "2020-01-01T05:00:00.000Z" }),
        },
      }),
      page({
        id: "b",
        template: "duo-side",
        slots: { photo1: photo("photo1", { imageUrl: "/c", takenAt: "2025-03-01T05:00:00.000Z" }), photo2: photo("photo2") },
      }),
    ];
    expect(bookStats(pages)).toEqual({
      stops: 2,
      media: 2,
      first: "2025-02-01T05:00:00.000Z",
      last: "2025-03-01T05:00:00.000Z",
    });
  });
});
