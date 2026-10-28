import { dayKey } from "./dates";
import type { TemplateKey } from "./templates";

// "Add many photos": uploaded files → stops, grouped by day and shaped by
// count and orientation. Pure, so the review sheet and the tests agree.

export type Uploaded = {
  id: string;
  kind: "photo" | "video";
  width: number | null;
  height: number | null;
  takenAt: string | null;
  imageUrl: string;
  thumbUrl: string | null;
  videoUrl: string | null;
  lat: number | null;
  lng: number | null;
};

export type DraftStop = { template: TemplateKey; items: Uploaded[] };
export type DayGroup = { day: string | null; stops: DraftStop[] };

const landscape = (u: Uploaded) => (u.width ?? 0) > (u.height ?? 0);

/** Split n photos into stops of at most three, never leaving a single one after a three. */
export function chunkSizes(n: number): number[] {
  const out: number[] = [];
  let left = n;
  while (left > 0) {
    if (left === 4) {
      out.push(2, 2);
      left = 0;
    } else {
      const take = Math.min(3, left);
      out.push(take);
      left -= take;
    }
  }
  return out;
}

function stopFor(items: Uploaded[]): DraftStop {
  if (items.length === 1) return { template: landscape(items[0]) ? "single-wide" : "single-tall", items };
  if (items.length === 2) return { template: items.every(landscape) ? "duo-stack" : "duo-side", items };
  // trio: the widest photo takes the 4:3 frame on top
  const ratio = (u: Uploaded) => (u.width ?? 1) / (u.height ?? 1);
  const widest = items.reduce((a, b) => (ratio(b) > ratio(a) ? b : a));
  return { template: "trio", items: [widest, ...items.filter((u) => u !== widest)] };
}

function stopsOf(items: Uploaded[]): DraftStop[] {
  const stops: DraftStop[] = [];
  const photos: Uploaded[] = [];
  for (const u of items) {
    if (u.kind === "video") stops.push({ template: landscape(u) ? "video-wide" : "video-tall", items: [u] });
    else photos.push(u);
  }
  let at = 0;
  for (const size of chunkSizes(photos.length)) {
    stops.push(stopFor(photos.slice(at, at + size)));
    at += size;
  }
  return stops;
}

export function groupUploads(items: Uploaded[]): DayGroup[] {
  const dated = items.filter((u) => u.takenAt).sort((a, b) => a.takenAt!.localeCompare(b.takenAt!));
  const undated = items.filter((u) => !u.takenAt);
  const days = new Map<string, Uploaded[]>();
  for (const u of dated) {
    const k = dayKey(new Date(u.takenAt!));
    days.set(k, [...(days.get(k) ?? []), u]);
  }
  const groups: DayGroup[] = [...days.entries()].map(([day, list]) => ({ day, stops: stopsOf(list) }));
  if (undated.length) groups.push({ day: null, stops: stopsOf(undated) });
  return groups;
}
