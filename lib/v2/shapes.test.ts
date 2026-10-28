import { describe, expect, test } from "vitest";
import { peaksPath, scallopPath, trailPath, wavePath } from "./shapes";
import { mulberry32 } from "./rng";

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const xs = (d: string) => {
  // every "x y" pair after a command letter; good enough to check the span
  const pts = d.replace(/[MLQTZA]/g, " ").trim().split(/\s+/).map(Number);
  return pts.filter((_, i) => i % 2 === 0);
};

describe("landscape paths", () => {
  test("waves start at x0, reach past x1 and close at the bottom", () => {
    const d = wavePath(100, 900, 560, 20, 300);
    expect(d.startsWith("M100 720 L100 560")).toBe(true);
    expect(d.endsWith("720Z")).toBe(true);
    expect(Math.max(...xs(d))).toBeGreaterThanOrEqual(900);
    expect(nums(d).every(Number.isFinite)).toBe(true);
  });

  test("a phase shifts the crests without moving the ends", () => {
    const a = wavePath(0, 600, 500, 20, 300, 0);
    const b = wavePath(0, 600, 500, 20, 300, 0.5);
    expect(a).not.toBe(b);
    expect(b.startsWith("M0 720 L0")).toBe(true);
  });

  test("scallops tile the span with semicircles", () => {
    const d = scallopPath(0, 200, 600, 25);
    expect((d.match(/a25 25 0 0 1 50 0/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(d.endsWith("720Z")).toBe(true);
  });

  test("peaks stay above the base and are seed-stable", () => {
    const d1 = peaksPath(0, 800, 470, 170, mulberry32(3));
    const d2 = peaksPath(0, 800, 470, 170, mulberry32(3));
    expect(d1).toBe(d2);
    const ys = nums(d1).filter((_, i) => i % 2 === 1).filter((y) => y !== 720);
    expect(Math.max(...ys)).toBeLessThanOrEqual(470);
  });

  test("the trail is an open line across the span", () => {
    const d = trailPath(0, 1000, 642, 8, 520);
    expect(d.startsWith("M0 642")).toBe(true);
    expect(d.includes("Z")).toBe(false);
    expect(Math.max(...xs(d))).toBeGreaterThanOrEqual(1000);
  });
});
