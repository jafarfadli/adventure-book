import { expect, test } from "vitest";
import { hashString, mulberry32 } from "./rng";

test("hashString is stable and spreads", () => {
  expect(hashString("abc")).toBe(hashString("abc"));
  expect(hashString("abc")).not.toBe(hashString("abd"));
  expect(Number.isInteger(hashString("page-1"))).toBe(true);
  expect(hashString("page-1")).toBeGreaterThanOrEqual(0);
});

test("mulberry32 is deterministic and in [0, 1)", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const xs = Array.from({ length: 200 }, () => a());
  expect(xs).toEqual(Array.from({ length: 200 }, () => b()));
  expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  expect(mulberry32(1)()).not.toBe(mulberry32(2)());
});
