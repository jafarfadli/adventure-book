import { hashString, mulberry32 } from "./rng";
import type { Anchor, AnchorKind } from "./templates";

export type Placed = { anchor: Anchor; sticker: number; rot: number; scale: number };

const KEEP_P = 0.7;
const MIN_KEPT = 2;

/**
 * Which theme sticker goes on which template anchor. Deterministic per page
 * (its id) and per "shuffle" press (decorSeed), so a page looks the same on
 * every device until the couple asks for a new arrangement.
 */
export function placeDecorations(
  anchors: Anchor[],
  pools: Record<AnchorKind, number>,
  pageId: string,
  decorSeed: number,
): Placed[] {
  const rand = mulberry32(hashString(pageId) ^ Math.imul(decorSeed + 1, 0x9e3779b1));
  const usable = anchors.map((a, i) => ({ a, i })).filter(({ a }) => pools[a.kind] > 0);

  // roll every anchor first so the keep/drop decision is independent of picks
  const rolls = usable.map(({ a, i }) => ({ a, i, keep: rand() < KEEP_P, tiebreak: rand() }));
  const kept = rolls.filter((r) => r.keep);
  if (kept.length < MIN_KEPT) {
    const extra = rolls
      .filter((r) => !r.keep)
      .sort((x, y) => x.tiebreak - y.tiebreak)
      .slice(0, MIN_KEPT - kept.length);
    kept.push(...extra);
  }
  kept.sort((x, y) => x.i - y.i);

  const used: Record<AnchorKind, Set<number>> = { sky: new Set(), side: new Set(), ground: new Set() };
  return kept.map(({ a }) => {
    const size = pools[a.kind];
    const free = Array.from({ length: size }, (_, n) => n).filter((n) => !used[a.kind].has(n));
    const choices = free.length > 0 ? free : Array.from({ length: size }, (_, n) => n);
    const sticker = choices[Math.floor(rand() * choices.length)];
    used[a.kind].add(sticker);
    return {
      anchor: a,
      sticker,
      rot: Math.round((rand() * 2 - 1) * 12 * 10) / 10,
      scale: Math.round((0.85 + rand() * 0.3) * 100) / 100,
    };
  });
}
