import { expect, test } from "vitest";
import { worldScale } from "./scale";

test("phone portrait: width-bound, extra height split 60/40 sky/ground", () => {
  const r = worldScale(390, 844);
  expect(r.s).toBeCloseTo(390 / 460, 5);
  const spare = 844 - 720 * r.s;
  expect(r.bandTop).toBeCloseTo(spare * 0.6, 5);
  expect(r.topU).toBeCloseTo(-r.bandTop / r.s, 5);
  expect(r.bottomU).toBeCloseTo((spare * 0.4) / r.s, 5);
});

test("desktop: height-bound, no spare height", () => {
  const r = worldScale(1440, 900);
  expect(r.s).toBeCloseTo(900 / 720, 5);
  expect(r.bandTop).toBeCloseTo(0, 5);
  expect(r.topU).toBeCloseTo(0, 5);
  expect(r.bottomU).toBeCloseTo(0, 5);
});

test("degenerate sizes never divide by zero", () => {
  const r = worldScale(0, 0);
  expect(r.s).toBeGreaterThan(0);
  expect(Number.isFinite(r.topU)).toBe(true);
});
