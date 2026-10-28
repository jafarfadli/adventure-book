// Metadata parsing for uploads (pure). The upload route reads these before
// re-encoding strips everything from the stored files.

/** "+DD.DDDD+DDD.DDDD+AAA.AAA/" (QuickTime location) → decimal degrees. */
export function parseIso6709(v: string | undefined | null): { lat: number; lng: number } | null {
  if (!v) return null;
  const m = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)/.exec(v.trim());
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** A capture time worth keeping, or null (unset camera clocks report 1970). */
export function parseExifDate(v: unknown): Date | null {
  const d = v instanceof Date ? v : typeof v === "string" ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() < 1990) return null;
  return d;
}
