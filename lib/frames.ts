// Frame format for PHOTO/VIDEO slots. Stored on the slot; null reads as
// "square", which is what every frame was before formats existed.
export const FRAME_FORMATS = ["portrait", "square", "landscape"] as const;

export type FrameFormat = (typeof FRAME_FORMATS)[number];

export const FRAME_LABELS: Record<FrameFormat, string> = {
  portrait: "Potret (2:3)",
  square: "Kotak (1:1)",
  landscape: "Lanskap (3:2)",
};

/** CSS aspect-ratio of the media window inside the frame. */
export const FRAME_RATIO: Record<FrameFormat, string> = {
  portrait: "2 / 3",
  square: "1 / 1",
  landscape: "3 / 2",
};

/**
 * Width multiplier applied to the size a layout asks for. Chosen so every
 * format ends up the same *height*: the page has a fixed height and the
 * layouts stack frames vertically, so keeping height constant is what stops
 * a portrait photo from pushing the story off the page.
 */
const WIDTH_FACTOR: Record<FrameFormat, number> = {
  portrait: 2 / 3,
  square: 1,
  landscape: 3 / 2,
};

export function isFrameFormat(value: string): value is FrameFormat {
  return (FRAME_FORMATS as readonly string[]).includes(value);
}

export function toFrameFormat(value: string | null | undefined): FrameFormat {
  return value && isFrameFormat(value) ? value : "square";
}

/** Rendered frame width in px for a layout's requested size. */
export function frameWidth(size: number, format: FrameFormat): number {
  return Math.round(size * WIDTH_FACTOR[format]);
}

/** Classify uploaded media by its pixel dimensions, for a sensible default. */
export function detectFormat(width: number, height: number): FrameFormat {
  if (!width || !height) return "square";
  const ratio = width / height;
  if (ratio >= 1.2) return "landscape";
  if (ratio <= 0.84) return "portrait";
  return "square";
}
