import { describe, expect, test } from "vitest";
import { GAP, layoutWorld, skyAt, SIGN_W, START_W, END_W } from "./world";
import { TEMPLATES } from "./templates";
import { emptySlot, type PageV2 } from "./types";
import { THEMES, type ThemeKey } from "./themes";

function page(id: string, template: PageV2["template"], theme: ThemeKey, date?: string): PageV2 {
  const photo = { ...emptySlot("photo1", "PHOTO"), takenAt: date ?? null };
  return { id, order: 0, template, theme, ownTheme: null, decorSeed: 0, slots: { photo1: photo } };
}

describe("layoutWorld", () => {
  const pages = [
    page("a", "single-tall", "stroberi", "2026-07-15T05:00:00Z"),
    page("b", "duo-side", "stroberi", "2026-07-23T05:00:00Z"),
    page("c", "trio", "senja", "2026-08-02T05:00:00Z"),
    page("d", "single-tall", "senja"), // undated: inherits August
    page("e", "single-wide", "lavender", "2026-08-30T05:00:00Z"),
  ];
  const w = layoutWorld(pages, "stroberi");

  test("start, stops, month sign, end — in order, with gaps", () => {
    expect(w.segments.map((s) => (s.kind === "stop" ? s.pageId : s.kind))).toEqual([
      "start",
      "a",
      "b",
      "sign",
      "c",
      "d",
      "e",
      "end",
    ]);
    const [start, a] = w.segments;
    expect(start.x).toBe(0);
    expect(start.w).toBe(START_W);
    expect(a.x).toBe(START_W + GAP);
    expect(a.w).toBe(TEMPLATES["single-tall"].width);
    const last = w.segments[w.segments.length - 1];
    expect(last.kind).toBe("end");
    expect(last.w).toBe(END_W);
    expect(w.width).toBe(last.x + last.w);
  });

  test("the month sign names the new month and takes the next stop's theme", () => {
    const sign = w.segments.find((s) => s.kind === "sign")!;
    expect(sign.kind === "sign" && sign.label).toBe("Agustus 2026");
    expect(sign.theme).toBe("senja");
    expect(sign.w).toBe(SIGN_W);
  });

  test("slices partition the world exactly, one per segment", () => {
    expect(w.slices[0].x0).toBe(0);
    expect(w.slices[w.slices.length - 1].x1).toBe(w.width);
    for (let i = 1; i < w.slices.length; i++) expect(w.slices[i].x0).toBe(w.slices[i - 1].x1);
    expect(w.slices).toHaveLength(w.segments.length);
  });

  test("seams sit where the theme changes", () => {
    expect(w.seams.map((s) => [s.from, s.to])).toEqual([
      ["stroberi", "senja"],
      ["senja", "lavender"],
    ]);
    for (const seam of w.seams) {
      const at = w.slices.findIndex((sl) => sl.x0 === seam.x);
      expect(at).toBeGreaterThan(0);
    }
  });

  test("stops know their centre and month for the timeline", () => {
    const a = w.stops.find((s) => s.pageId === "a")!;
    expect(a.cx).toBe(START_W + GAP + TEMPLATES["single-tall"].width / 2);
    expect(w.stops.map((s) => s.monthShort)).toEqual(["Jul", null, "Agu", null, null]);
  });

  test("an empty book is just start and end", () => {
    const empty = layoutWorld([], "laut");
    expect(empty.segments.map((s) => s.kind)).toEqual(["start", "end"]);
    expect(empty.segments.every((s) => s.theme === "laut")).toBe(true);
  });
});

describe("skyAt", () => {
  const w = layoutWorld(
    [page("a", "single-tall", "stroberi"), page("b", "single-tall", "lavender")],
    "stroberi",
  );
  test("pure colour away from seams, a blend across them", () => {
    expect(skyAt(w, 10)).toBe(THEMES.stroberi.sky);
    expect(skyAt(w, w.width - 10)).toBe(THEMES.lavender.sky);
    const mid = skyAt(w, w.seams[0].x);
    expect(mid).toMatch(/^rgb\(/);
    expect(mid).not.toBe(THEMES.stroberi.sky);
  });
});
