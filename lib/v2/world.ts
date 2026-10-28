import { monthKey, monthLabel, shortMonth, slotDate } from "./dates";
import { TEMPLATES } from "./templates";
import { THEMES, type ThemeKey } from "./themes";
import type { PageV2 } from "./types";

// Layout of one book as a single horizontal world, in design units. Pure and
// deterministic: the reader, the editor and the tests all call this.
//
//   [start] gap [stop] gap [stop] gap [month sign] gap [stop] ... gap [end]
//
// Every segment owns one scenery slice that runs from the middle of the gap
// before it to the middle of the gap after it, so slices tile the world
// exactly and a theme change always falls in a gap (where a bush covers it).

export const GAP = 90;
export const START_W = 420;
export const SIGN_W = 180;
export const END_W = 760;
/** Sky colours crossfade over this many units each side of a seam. */
export const SKY_BLEND = 260;

type Base = { x: number; w: number; theme: ThemeKey };
export type Segment =
  | (Base & { kind: "start" })
  | (Base & { kind: "stop"; pageId: string; index: number })
  | (Base & { kind: "sign"; label: string })
  | (Base & { kind: "end" });

export type Slice = { x0: number; x1: number; theme: ThemeKey; segment: number };
export type Seam = { x: number; from: ThemeKey; to: ThemeKey };
export type StopInfo = { pageId: string; index: number; cx: number; x: number; w: number; monthShort: string | null };

export type WorldLayout = {
  width: number;
  segments: Segment[];
  slices: Slice[];
  seams: Seam[];
  stops: StopInfo[];
};

function pageDate(p: PageV2): Date | null {
  for (const s of Object.values(p.slots)) {
    const d = slotDate(s);
    if (d) return d;
  }
  return null;
}

export function layoutWorld(pages: PageV2[], bookTheme: ThemeKey): WorldLayout {
  const segments: Segment[] = [];
  const stops: StopInfo[] = [];
  let x = 0;
  const push = (seg: Segment) => {
    segments.push(seg);
    x = seg.x + seg.w + GAP;
  };

  const firstTheme = pages[0]?.theme ?? bookTheme;
  push({ kind: "start", x, w: START_W, theme: firstTheme });

  let month: string | null = null;
  pages.forEach((p, index) => {
    const d = pageDate(p);
    const key = d ? monthKey(d) : month;
    if (d && month && key !== month) {
      push({ kind: "sign", x, w: SIGN_W, theme: p.theme, label: monthLabel(d) });
    }
    const w = TEMPLATES[p.template].width;
    stops.push({
      pageId: p.id,
      index,
      x,
      w,
      cx: x + w / 2,
      // a month label on the timeline wherever a new month starts
      monthShort: d && key !== month ? shortMonth(d) : null,
    });
    push({ kind: "stop", x, w, theme: p.theme, pageId: p.id, index });
    month = key;
  });

  const lastTheme = pages[pages.length - 1]?.theme ?? bookTheme;
  push({ kind: "end", x, w: END_W, theme: lastTheme });
  const width = x - GAP;

  const slices: Slice[] = segments.map((s, i) => ({
    x0: i === 0 ? 0 : s.x - GAP / 2,
    x1: i === segments.length - 1 ? width : s.x + s.w + GAP / 2,
    theme: s.theme,
    segment: i,
  }));

  const seams: Seam[] = [];
  for (let i = 1; i < slices.length; i++) {
    if (slices[i].theme !== slices[i - 1].theme) {
      seams.push({ x: slices[i].x0, from: slices[i - 1].theme, to: slices[i].theme });
    }
  }

  return { width, segments, slices, seams, stops };
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((sh) => {
    const x = (pa >> sh) & 255;
    const y = (pb >> sh) & 255;
    return Math.round(x + (y - x) * t);
  });
  return `rgb(${c.join(",")})`;
}

/** Sky colour at world x: the slice's theme, crossfaded near a seam. */
export function skyAt(w: WorldLayout, x: number): string {
  for (const seam of w.seams) {
    if (Math.abs(x - seam.x) < SKY_BLEND) {
      const t = (x - (seam.x - SKY_BLEND)) / (2 * SKY_BLEND);
      return lerpHex(THEMES[seam.from].sky, THEMES[seam.to].sky, t);
    }
  }
  const slice = w.slices.find((s) => x >= s.x0 && x < s.x1) ?? w.slices[w.slices.length - 1];
  return THEMES[slice.theme].sky;
}

/** Index of the stop nearest to world x (for keyboard nav and the timeline knob). */
export function nearestStop(w: WorldLayout, x: number): number {
  let best = -1;
  let bestD = Infinity;
  w.stops.forEach((s, i) => {
    const d = Math.abs(s.cx - x);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
