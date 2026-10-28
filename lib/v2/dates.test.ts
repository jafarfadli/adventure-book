import { describe, expect, test } from "vitest";
import { dayKey, monthKey, monthLabel, parseIndoDate, shortMonth, slotDate, stampParts, stampText } from "./dates";

const iso = (d: Date | null) => (d ? d.toISOString() : null);

describe("parseIndoDate", () => {
  test("every label format present in the live book", () => {
    // noon in Asia/Jakarta (UTC+7) = 05:00Z, so the day never slips
    expect(iso(parseIndoDate("23 Juli 2026"))).toBe("2026-07-23T05:00:00.000Z");
    expect(iso(parseIndoDate("15 Jul 2026"))).toBe("2026-07-15T05:00:00.000Z");
    expect(iso(parseIndoDate("12 Agustus 2026"))).toBe("2026-08-12T05:00:00.000Z");
    expect(iso(parseIndoDate("17 Agu 2026"))).toBe("2026-08-17T05:00:00.000Z");
    expect(iso(parseIndoDate("1 Sep 2026"))).toBe("2026-09-01T05:00:00.000Z");
  });

  test("other spellings people type", () => {
    expect(iso(parseIndoDate("14 Feb 2025"))).toBe("2025-02-14T05:00:00.000Z");
    expect(iso(parseIndoDate("3 Mei 2026"))).toBe("2026-05-03T05:00:00.000Z");
    expect(iso(parseIndoDate("9 okt. 2026"))).toBe("2026-10-09T05:00:00.000Z");
    expect(iso(parseIndoDate("31 Desember 2026"))).toBe("2026-12-31T05:00:00.000Z");
    expect(iso(parseIndoDate("17/08/2026"))).toBe("2026-08-17T05:00:00.000Z");
    expect(iso(parseIndoDate("  2 Sept 2026 "))).toBe("2026-09-02T05:00:00.000Z");
  });

  test("anything else is not a date", () => {
    expect(parseIndoDate(null)).toBeNull();
    expect(parseIndoDate("")).toBeNull();
    expect(parseIndoDate("malam minggu")).toBeNull();
    expect(parseIndoDate("31 Februari 2026")).toBeNull();
    expect(parseIndoDate("12 Foo 2026")).toBeNull();
  });
});

describe("formatting (Asia/Jakarta)", () => {
  // 2026-08-31 18:30Z is already 1 September in Jakarta
  const lateNight = new Date("2026-08-31T18:30:00Z");

  test("stamp parts", () => {
    expect(stampParts(new Date("2026-07-15T05:00:00Z"))).toEqual({ day: "15 Jul", year: "2026" });
    expect(stampParts(lateNight)).toEqual({ day: "1 Sep", year: "2026" });
  });

  test("month labels and keys", () => {
    expect(monthLabel(new Date("2026-08-12T05:00:00Z"))).toBe("Agustus 2026");
    expect(shortMonth(new Date("2026-08-12T05:00:00Z"))).toBe("Agu");
    expect(monthKey(lateNight)).toBe("2026-09");
    expect(dayKey(lateNight)).toBe("2026-09-01");
  });
});

describe("slot dates", () => {
  const base = { dateLabel: null, takenAt: null, showDate: true };

  test("chronology prefers the capture time, then the label", () => {
    expect(iso(slotDate({ ...base, takenAt: "2026-07-01T10:00:00Z", dateLabel: "15 Jul 2026" }))).toBe(
      "2026-07-01T10:00:00.000Z",
    );
    expect(iso(slotDate({ ...base, dateLabel: "15 Jul 2026" }))).toBe("2026-07-15T05:00:00.000Z");
    expect(slotDate(base)).toBeNull();
  });

  test("the stamp prefers what the couple wrote, then the capture time", () => {
    expect(stampText({ ...base, dateLabel: "17 Agu 2026", takenAt: "2026-07-01T10:00:00Z" })).toEqual({
      day: "17 Agu",
      year: "2026",
    });
    expect(stampText({ ...base, takenAt: "2026-07-01T10:00:00Z" })).toEqual({ day: "1 Jul", year: "2026" });
  });

  test("free text is shown as written; hidden dates show nothing", () => {
    expect(stampText({ ...base, dateLabel: "malam minggu" })).toEqual({ day: "malam minggu", year: "" });
    expect(stampText({ ...base, dateLabel: "15 Jul 2026", showDate: false })).toBeNull();
    expect(stampText(base)).toBeNull();
  });
});
