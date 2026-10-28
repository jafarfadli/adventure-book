import { hashString, mulberry32 } from "./rng";

// Path builders for the cut-paper landscape. Pure string functions so the
// shapes are deterministic and testable; the theme kits only choose numbers.

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Rolling band from x0 to past x1 at height y, closed down to the bottom (y=720). */
export function wavePath(x0: number, x1: number, y: number, amp: number, period: number, phase = 0): string {
  const half = period / 2;
  // shifting the first crest by a phase gives neighbouring bands different rhythms
  const lead = half * (phase % 1);
  let x = x0 + lead;
  let d = `M${r1(x0)} 720 L${r1(x0)} ${r1(y)} L${r1(x)} ${r1(y)}`;
  d += ` Q${r1(x + period / 4)} ${r1(y - amp)} ${r1(x + half)} ${r1(y)}`;
  x += half;
  while (x < x1) {
    d += ` T${r1(x + half)} ${r1(y)}`;
    x += half;
  }
  return `${d} L${r1(x)} 720Z`;
}

/** A row of semicircles (lace / doily edge), closed to the bottom. */
export function scallopPath(x0: number, x1: number, y: number, r: number): string {
  let d = `M${r1(x0)} 720 L${r1(x0)} ${r1(y)}`;
  let x = x0;
  while (x < x1) {
    d += ` a${r} ${r} 0 0 1 ${2 * r} 0`;
    x += 2 * r;
  }
  return `${d} L${r1(x)} 720Z`;
}

/** Jagged mountain ridge: alternating peaks and saddles, closed to the bottom. */
export function peaksPath(x0: number, x1: number, base: number, step: number, rand: () => number): string {
  let d = `M${r1(x0)} 720 L${r1(x0)} ${r1(base)}`;
  let up = true;
  let x = x0 + step / 2;
  for (; x < x1 + step; x += step / 2) {
    const y = up ? base - 70 - rand() * 80 : base - 10 - rand() * 20;
    d += ` L${r1(x)} ${r1(y)}`;
    up = !up;
  }
  return `${d} L${r1(x)} ${r1(base)} L${r1(x)} 720Z`;
}

/** The dotted footpath: an open gentle wave (stroke only). */
export function trailPath(x0: number, x1: number, y: number, amp: number, period: number): string {
  const half = period / 2;
  let x = x0;
  let d = `M${r1(x0)} ${r1(y)} Q${r1(x + period / 4)} ${r1(y - amp)} ${r1(x + half)} ${r1(y)}`;
  x += half;
  while (x < x1) {
    d += ` T${r1(x + half)} ${r1(y)}`;
    x += half;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Globally aligned variants. The world draws each layer in slices (one per
// stop, for virtualisation); a band built from a slice's own start would kink
// where slices meet. These place every crest / vertex on a grid anchored at
// x = offset, so any two slices of the same band agree exactly where they
// overlap, and the caller can clip each slice to its own range.

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Rolling band on a global grid; starts one half-period before x0 and ends past x1. */
export function globalWavePath(x0: number, x1: number, y: number, amp: number, period: number, offset = 0): string {
  const half = period / 2;
  const k0 = Math.floor((x0 - offset) / half) - 1;
  let x = k0 * half + offset;
  const up = mod(k0, 2) === 0;
  let d = `M${r1(x)} 720 L${r1(x)} ${r1(y)} Q${r1(x + half / 2)} ${r1(up ? y - amp : y + amp)} ${r1(x + half)} ${r1(y)}`;
  x += half;
  while (x < x1 + half) {
    d += ` T${r1(x + half)} ${r1(y)}`;
    x += half;
  }
  return `${d} L${r1(x)} 720Z`;
}

/** Semicircle lace on a global grid. */
export function globalScallopPath(x0: number, x1: number, y: number, r: number, offset = 0): string {
  const step = 2 * r;
  let x = Math.floor((x0 - offset) / step) * step + offset - step;
  let d = `M${r1(x)} 720 L${r1(x)} ${r1(y)}`;
  while (x < x1 + step) {
    d += ` a${r} ${r} 0 0 1 ${step} 0`;
    x += step;
  }
  return `${d} L${r1(x)} 720Z`;
}

/** Mountain ridge whose vertex heights come from the vertex index, not the slice. */
export function globalPeaksPath(x0: number, x1: number, base: number, step: number, seed: number): string {
  const half = step / 2;
  const k0 = Math.floor(x0 / half) - 1;
  const k1 = Math.ceil(x1 / half) + 1;
  const height = (k: number) => {
    const rnd = mulberry32(hashString(`${seed}:${k}`));
    return mod(k, 2) === 0 ? base - 70 - rnd() * 80 : base - 10 - rnd() * 20;
  };
  let d = `M${r1(k0 * half)} 720 L${r1(k0 * half)} ${r1(height(k0))}`;
  for (let k = k0 + 1; k <= k1; k++) d += ` L${r1(k * half)} ${r1(height(k))}`;
  return `${d} L${r1(k1 * half)} 720Z`;
}

/** The dotted footpath on a global grid (open stroke). */
export function globalTrailPath(x0: number, x1: number, y: number, amp: number, period: number): string {
  const half = period / 2;
  const k0 = Math.floor(x0 / half) - 1;
  let x = k0 * half;
  const up = mod(k0, 2) === 0;
  let d = `M${r1(x)} ${r1(y)} Q${r1(x + half / 2)} ${r1(up ? y - amp : y + amp)} ${r1(x + half)} ${r1(y)}`;
  x += half;
  while (x < x1 + half) {
    d += ` T${r1(x + half)} ${r1(y)}`;
    x += half;
  }
  return d;
}

/**
 * Scatter items on a global grid: item i sits near i·step with a jitter drawn
 * from its own index, and belongs to whichever slice contains its x.
 */
export function scatter<T>(
  x0: number,
  x1: number,
  step: number,
  seed: number,
  make: (x: number, rnd: () => number, i: number) => T,
): T[] {
  const out: T[] = [];
  for (let i = Math.floor(x0 / step) - 1; i <= Math.ceil(x1 / step); i++) {
    const rnd = mulberry32(hashString(`${seed}#${i}`));
    const x = i * step + (rnd() - 0.5) * step * 0.6;
    if (x >= x0 && x < x1) out.push(make(x, rnd, i));
  }
  return out;
}
