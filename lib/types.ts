import type { Layout, SlotType } from "@prisma/client";

// Plain serializable DTOs passed from server components to the client reader.

export type SlotData = {
  key: string;
  type: SlotType;
  imageUrl: string | null;
  thumbUrl: string | null;
  videoUrl: string | null;
  aspect: string | null;
  caption: string | null;
  text: string | null;
  rotation: number;
  tapeStyle: string | null;
  dateLabel: string | null;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  locationSource: string | null;
};

export type PageData = {
  id: string;
  order: number;
  layout: Layout;
  bgStyle: string | null;
  slots: SlotData[];
};

export type BookData = {
  slug: string;
  title: string;
  subtitle: string | null;
  theme: string;
  coverImageUrl: string | null;
  pages: PageData[];
};
