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
  /** "exif" | "manual" — a manual pin is never replaced by a re-upload's EXIF */
  locationSource: "exif" | "manual" | null;
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
  /** every slot row of the page, including ones the current template hides */
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
    locationSource: null,
    width: null,
    height: null,
  };
}

export type BookV2 = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  volume: number;
  theme: ThemeKey;
  coverImageUrl: string | null;
  coverFocusX: number;
  coverFocusY: number;
  coverText: string | null;
  closingText: string | null;
  pages: PageV2[];
  stats: { stops: number; media: number; first: string | null; last: string | null };
  wishlistTop: { id: string; text: string }[];
};
