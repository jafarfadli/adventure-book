import type { TemplateKey } from "./templates";
import type { ThemeKey } from "./themes";

// Serializable DTOs handed from server components to the v2 renderer.

export type SlotV2 = {
  key: string;
  type: "PHOTO" | "VIDEO" | "TEXT";
  imageUrl: string | null;
  thumbUrl: string | null;
  videoUrl: string | null;
  caption: string | null;
  text: string | null;
  focusX: number;
  focusY: number;
  dateLabel: string | null;
  /** ISO string (Dates do not cross the server/client boundary) */
  takenAt: string | null;
  showDate: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  width: number | null;
  height: number | null;
};

export type PageV2 = {
  id: string;
  order: number;
  template: TemplateKey;
  theme: ThemeKey;
  /** Page.theme as stored (null = follows the book) — the editor needs the difference */
  ownTheme: ThemeKey | null;
  decorSeed: number;
  slots: Record<string, SlotV2>;
};

export function emptySlot(key: string, type: SlotV2["type"]): SlotV2 {
  return {
    key,
    type,
    imageUrl: null,
    thumbUrl: null,
    videoUrl: null,
    caption: null,
    text: null,
    focusX: 0.5,
    focusY: 0.5,
    dateLabel: null,
    takenAt: null,
    showDate: true,
    lat: null,
    lng: null,
    locationLabel: null,
    width: null,
    height: null,
  };
}
