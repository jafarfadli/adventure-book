import { describe, expect, test } from "vitest";
import { mediaFileName, planBookParts, planTakenAt, planTemplates } from "./backfill";

describe("planTemplates", () => {
  test("fills only pages without a v2 template, skipping book parts", () => {
    const plan = planTemplates([
      { id: "a", layout: "SINGLE", template: null, slots: [{ key: "photo1", width: 1600, height: 1200 }] },
      { id: "b", layout: "DUO", template: "duo-side", slots: [] },
      { id: "c", layout: "COVER", template: null, slots: [] },
      { id: "d", layout: "DUO", template: null, slots: [{ key: "photo1", width: 1600, height: 1200 }, { key: "photo2", width: 1600, height: 1200 }] },
    ]);
    expect(plan).toEqual([
      { id: "a", template: "single-wide" },
      { id: "d", template: "duo-stack" },
    ]);
  });
});

describe("planTakenAt", () => {
  test("parses labels only where the capture time is unknown", () => {
    const plan = planTakenAt([
      { id: "1", dateLabel: "15 Jul 2026", takenAt: null },
      { id: "2", dateLabel: "17 Agu 2026", takenAt: new Date("2026-08-17T01:00:00Z") },
      { id: "3", dateLabel: "malam minggu", takenAt: null },
      { id: "4", dateLabel: null, takenAt: null },
    ]);
    expect(plan.map((p) => [p.id, p.takenAt.toISOString()])).toEqual([["1", "2026-07-15T05:00:00.000Z"]]);
  });
});

describe("planBookParts", () => {
  const pages = [
    { layout: "COVER" as const, slots: [{ key: "photo1", imageUrl: "/adventure/api/media/c.webp", text: null }, { key: "text1", imageUrl: null, text: "Kita makan di kopi Nako" }] },
    { layout: "SINGLE" as const, slots: [] },
    { layout: "CLOSING" as const, slots: [{ key: "text1", imageUrl: null, text: "see u later sarah" }] },
  ];

  test("copies cover and closing into the book and maps the legacy theme", () => {
    expect(planBookParts({ theme: "cream", coverImageUrl: null, coverText: null, closingText: null }, pages)).toEqual({
      theme: "stroberi",
      coverImageUrl: "/adventure/api/media/c.webp",
      coverText: "Kita makan di kopi Nako",
      closingText: "see u later sarah",
    });
  });

  test("never overwrites what is already set", () => {
    expect(planBookParts({ theme: "laut", coverImageUrl: "/x.webp", coverText: "hai", closingText: "dadah" }, pages)).toEqual({});
  });
});

test("media file names come only from our own media route", () => {
  expect(mediaFileName("/adventure/api/media/0aff-12.webp")).toBe("0aff-12.webp");
  expect(mediaFileName("/adventure/api/media/../../etc/passwd")).toBeNull();
  expect(mediaFileName("https://example.com/a.webp")).toBeNull();
  expect(mediaFileName(null)).toBeNull();
});
