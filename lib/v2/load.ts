import type { Layout, Prisma } from "@prisma/client";
import { resolveTemplate, slotSpecs } from "./templates";
import { isThemeKey, resolvePageTheme } from "./themes";
import { emptySlot, type PageV2, type SlotV2 } from "./types";

// Prisma rows → v2 DTOs. Shared by the reader, the editor and the dev gallery.

export const slotSelect = {
  key: true,
  type: true,
  imageUrl: true,
  thumbUrl: true,
  videoUrl: true,
  caption: true,
  text: true,
  focusX: true,
  focusY: true,
  dateLabel: true,
  takenAt: true,
  showDate: true,
  lat: true,
  lng: true,
  locationLabel: true,
  width: true,
  height: true,
} satisfies Prisma.SlotSelect;

export const pageSelect = {
  id: true,
  order: true,
  layout: true,
  template: true,
  theme: true,
  decorSeed: true,
  slots: { select: slotSelect },
} satisfies Prisma.PageSelect;

type SlotRow = Prisma.SlotGetPayload<{ select: typeof slotSelect }>;
type PageRow = { id: string; order: number; layout: Layout; template: string | null; theme: string | null; decorSeed: number; slots: SlotRow[] };

export function toSlotV2(s: SlotRow): SlotV2 {
  return {
    key: s.key,
    type: s.type,
    imageUrl: s.imageUrl,
    thumbUrl: s.thumbUrl,
    videoUrl: s.videoUrl,
    caption: s.caption,
    text: s.text,
    focusX: s.focusX,
    focusY: s.focusY,
    dateLabel: s.dateLabel,
    takenAt: s.takenAt ? s.takenAt.toISOString() : null,
    showDate: s.showDate,
    lat: s.lat,
    lng: s.lng,
    locationLabel: s.locationLabel,
    width: s.width,
    height: s.height,
  };
}

/** null for book parts (COVER/CLOSING) — they are not stops in v2. */
export function toPageV2(p: PageRow, bookTheme: string): PageV2 | null {
  const template = resolveTemplate(p);
  if (!template) return null;
  const slots: Record<string, SlotV2> = {};
  for (const spec of slotSpecs(template)) {
    const row = p.slots.find((s) => s.key === spec.key);
    slots[spec.key] = row ? toSlotV2(row) : emptySlot(spec.key, spec.type);
  }
  return {
    id: p.id,
    order: p.order,
    template,
    theme: resolvePageTheme(p.theme, bookTheme),
    ownTheme: isThemeKey(p.theme) ? p.theme : null,
    decorSeed: p.decorSeed,
    slots,
  };
}
