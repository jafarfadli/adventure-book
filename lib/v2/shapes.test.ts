import { describe, expect, test } from "vitest";
import {
  globalPeaksPath,
  globalScallopPath,
  globalTrailPath,
  globalWavePath,
  peaksPath,
  scallopPath,
  scatter,
  trailPath,
  wavePath,
} from "./shapes";
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


const vertices = (d: string) => {
  const out: [number, number][] = [];
  const re = /([MLQT])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?))?/g;
  for (let m; (m = re.exec(d)); ) {
    if (m[4] !== undefined) out.push([Number(m[4]), Number(m[5])]);
    else out.push([Number(m[2]), Number(m[3])]);
  }
  return out.filter(([, y]) => y !== 720);
};

describe("global (slice-safe) paths", () => {
  test("two slices of one wave agree where they overlap", () => {
    const a = vertices(globalWavePath(0, 1000, 560, 20, 300, 37)).filter(([x]) => x >= 500 && x <= 1000);
    const b = vertices(globalWavePath(480, 1600, 560, 20, 300, 37)).filter(([x]) => x >= 500 && x <= 1000);
    expect(a).toEqual(b);
  });

  test("crest direction is global, not per slice", () => {
    const a = globalWavePath(0, 900, 500, 20, 300);
    const b = globalWavePath(150, 900, 500, 20, 300);
    // both must contain the crest control point at x=75 or the trough at 225
    expect(a.includes("Q") && b.includes("Q")).toBe(true);
    const ctrl = (d: string) => /Q(-?[\d.]+) (-?[\d.]+)/.exec(d)!;
    const ca = ctrl(a);
    const cb = ctrl(b);
    // control points sit at half-period centres; their direction alternates with the index
    const dir = (x: number, y: number) => ((Math.round((x - 75) / 150) % 2) + 2) % 2 === 0 ? y < 500 : y > 500;
    expect(dir(Number(ca[1]), Number(ca[2]))).toBe(dir(Number(cb[1]), Number(cb[2])));
  });

  test("peaks and scallops are slice-stable too", () => {
    const pa = vertices(globalPeaksPath(0, 1200, 470, 170, 5)).filter(([x]) => x >= 400 && x <= 1000);
    const pb = vertices(globalPeaksPath(300, 2000, 470, 170, 5)).filter(([x]) => x >= 400 && x <= 1000);
    expect(pa).toEqual(pb);
    expect(globalScallopPath(0, 300, 600, 24)).toMatch(/^M-48 720/);
  });

  test("trail and scatter cover the slice", () => {
    expect(globalTrailPath(0, 800, 642, 8, 520).includes("Z")).toBe(false);
    const xs1 = scatter(0, 2000, 250, 9, (x) => Math.round(x));
    const xs2 = [...scatter(0, 1000, 250, 9, (x) => Math.round(x)), ...scatter(1000, 2000, 250, 9, (x) => Math.round(x))];
    expect(xs1).toEqual(xs2);
    expect(xs1.every((x) => x >= 0 && x < 2000)).toBe(true);
  });
});
