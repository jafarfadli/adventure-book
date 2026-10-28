import { describe, expect, test } from "vitest";
import { placeDecorations } from "./decor";
import { TEMPLATES } from "./templates";

const anchors = TEMPLATES["trio"].anchors; // 6 anchors: 2 sky, 2 side, 2 ground
const pools = { sky: 4, side: 4, ground: 4 };

describe("placeDecorations", () => {
  test("same page + seed always gives the same stickers", () => {
    expect(placeDecorations(anchors, pools, "page-abc", 0)).toEqual(placeDecorations(anchors, pools, "page-abc", 0));
  });

  test("shuffling (seed + 1) changes the result", () => {
    const a = JSON.stringify(placeDecorations(anchors, pools, "page-abc", 0));
    const variants = new Set([1, 2, 3, 4].map((s) => JSON.stringify(placeDecorations(anchors, pools, "page-abc", s))));
    expect([...variants].some((v) => v !== a)).toBe(true);
  });

  test("keeps between 2 and all anchors, with bounded jitter", () => {
    for (let seed = 0; seed < 50; seed++) {
      const placed = placeDecorations(anchors, pools, `p${seed}`, seed);
      expect(placed.length).toBeGreaterThanOrEqual(2);
      expect(placed.length).toBeLessThanOrEqual(anchors.length);
      for (const p of placed) {
        expect(Math.abs(p.rot)).toBeLessThanOrEqual(12);
        expect(p.scale).toBeGreaterThanOrEqual(0.85);
        expect(p.scale).toBeLessThanOrEqual(1.15);
        expect(p.sticker).toBeGreaterThanOrEqual(0);
        expect(p.sticker).toBeLessThan(pools[p.anchor.kind]);
      }
    }
  });

  test("no sticker repeats within a kind while the pool has room", () => {
    for (let seed = 0; seed < 50; seed++) {
      const placed = placeDecorations(anchors, pools, "page-x", seed);
      for (const kind of ["sky", "side", "ground"] as const) {
        const used = placed.filter((p) => p.anchor.kind === kind).map((p) => p.sticker);
        expect(new Set(used).size).toBe(used.length);
      }
    }
  });

  test("a kind with an empty pool is skipped", () => {
    const placed = placeDecorations(anchors, { sky: 0, side: 3, ground: 3 }, "page-y", 7);
    expect(placed.every((p) => p.anchor.kind !== "sky")).toBe(true);
  });
});
