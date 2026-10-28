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
