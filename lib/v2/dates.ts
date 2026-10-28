// Indonesian date handling for stamps, month signposts and day grouping.
// Everything is computed in Asia/Jakarta (UTC+7, no DST) so a photo taken at
// 01:00 WIB lands on the right day even though it is "yesterday" in UTC.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// Every spelling we accept, lower-case, to a 0-based month.
const MONTH_LOOKUP: Record<string, number> = {};
MONTHS_LONG.forEach((m, i) => {
  MONTH_LOOKUP[m.toLowerCase()] = i;
});
MONTHS_SHORT.forEach((m, i) => {
  MONTH_LOOKUP[m.toLowerCase()] = i;
});
Object.assign(MONTH_LOOKUP, {
  ags: 7,
  agt: 7,
  aug: 7,
  sept: 8,
  oct: 9,
  nop: 10,
  dec: 11,
  may: 4,
  january: 0,
  february: 1,
  march: 2,
  june: 5,
  july: 6,
  august: 7,
  october: 9,
  december: 11,
});

/** A calendar day at noon WIB, so formatting in any zone keeps the day. */
function wibNoon(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month, day, 12) - WIB_OFFSET_MS);
  const back = toWib(d);
  // reject 31 Februari and friends
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month || back.getUTCDate() !== day) return null;
  return d;
}

/** Shifted copy whose UTC fields read as WIB wall-clock time. */
function toWib(d: Date): Date {
  return new Date(d.getTime() + WIB_OFFSET_MS);
}

export function parseIndoDate(label: string | null | undefined): Date | null {
  if (!label) return null;
  const s = label.trim().toLowerCase();

  const words = /^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/.exec(s);
  if (words) {
    const month = MONTH_LOOKUP[words[2]];
    if (month === undefined) return null;
    return wibNoon(Number(words[3]), month, Number(words[1]));
  }

  const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (numeric) return wibNoon(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));

  return null;
}

export function stampParts(d: Date): { day: string; year: string } {
  const w = toWib(d);
  return { day: `${w.getUTCDate()} ${MONTHS_SHORT[w.getUTCMonth()]}`, year: String(w.getUTCFullYear()) };
}

export function monthLabel(d: Date): string {
  const w = toWib(d);
  return `${MONTHS_LONG[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}

export function shortMonth(d: Date): string {
  return MONTHS_SHORT[toWib(d).getUTCMonth()];
}

export function monthKey(d: Date): string {
  const w = toWib(d);
  return `${w.getUTCFullYear()}-${String(w.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(d: Date): string {
  const w = toWib(d);
  return `${monthKey(d)}-${String(w.getUTCDate()).padStart(2, "0")}`;
}

/** Long form for sentences: "15 Juli 2026". */
export function longDate(d: Date): string {
  const w = toWib(d);
  return `${w.getUTCDate()} ${MONTHS_LONG[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}

type DatedSlot = { dateLabel: string | null; takenAt: Date | string | null; showDate: boolean };

function asDate(v: Date | string | null): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** When the moment happened: the capture time if known, else the written label. */
export function slotDate(slot: DatedSlot): Date | null {
  return asDate(slot.takenAt) ?? parseIndoDate(slot.dateLabel);
}

/**
 * What the date stamp shows: the couple's own label wins over the capture
 * time; a label that is not a date ("malam minggu") is shown as written.
 */
export function stampText(slot: DatedSlot): { day: string; year: string } | null {
  if (!slot.showDate) return null;
  if (slot.dateLabel && slot.dateLabel.trim()) {
    const parsed = parseIndoDate(slot.dateLabel);
    return parsed ? stampParts(parsed) : { day: slot.dateLabel.trim(), year: "" };
  }
  const taken = asDate(slot.takenAt);
  return taken ? stampParts(taken) : null;
}
