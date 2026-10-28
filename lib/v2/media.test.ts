import { expect, test } from "vitest";
import { parseIso6709, parseExifDate } from "./media";

test("QuickTime ISO 6709 locations", () => {
  expect(parseIso6709("-06.2251+106.8001+012.345/")).toEqual({ lat: -6.2251, lng: 106.8001 });
  expect(parseIso6709("+35.6895+139.6917/")).toEqual({ lat: 35.6895, lng: 139.6917 });
  expect(parseIso6709("garbage")).toBeNull();
  expect(parseIso6709("+95.0+10.0/")).toBeNull();
  expect(parseIso6709(undefined)).toBeNull();
});

test("capture dates from EXIF / QuickTime", () => {
  expect(parseExifDate(new Date("2026-08-17T03:00:00Z"))?.toISOString()).toBe("2026-08-17T03:00:00.000Z");
  expect(parseExifDate("2026-08-17T10:00:00.000000Z")?.toISOString()).toBe("2026-08-17T10:00:00.000Z");
  expect(parseExifDate("not a date")).toBeNull();
  expect(parseExifDate(new Date("1970-01-01T00:00:00Z"))).toBeNull(); // camera clock never set
  expect(parseExifDate(null)).toBeNull();
});
