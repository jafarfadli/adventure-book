import { slotDate } from "./dates";
import { slotSpecs } from "./templates";
import type { BookV2, PageV2, SlotV2 } from "./types";

// What a page actually shows. A page keeps every slot row it ever had (so
// switching templates back restores them), but only the slots its current
// template has a place for are seen — and only those may count anywhere a
// reader can notice: stats, month signs, map pins.

export function visibleSlots(page: Pick<PageV2, "template" | "slots">): SlotV2[] {
  return slotSpecs(page.template)
    .map((spec) => page.slots[spec.key])
    .filter((s): s is SlotV2 => s !== undefined);
}

/** A photo with its image, or a video with its clip. */
export function hasMedia(slot: SlotV2): boolean {
  return slot.type === "VIDEO" ? Boolean(slot.videoUrl) : slot.type === "PHOTO" ? Boolean(slot.imageUrl) : false;
}

/** When the stop happened: the first shown slot that knows a date. */
export function pageDate(page: Pick<PageV2, "template" | "slots">): Date | null {
  for (const s of visibleSlots(page)) {
    const d = slotDate(s);
    if (d) return d;
  }
  return null;
}

export function bookStats(pages: PageV2[]): BookV2["stats"] {
  const shown = pages.flatMap(visibleSlots);
  const dates = shown
    .map((s) => slotDate(s))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    stops: pages.length,
    media: shown.filter(hasMedia).length,
    first: dates[0]?.toISOString() ?? null,
    last: dates[dates.length - 1]?.toISOString() ?? null,
  };
}
