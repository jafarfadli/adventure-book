// Frame format for PHOTO/VIDEO slots. Stored on the slot; null reads as
// "square", which is what every frame was before formats existed.
export const FRAME_FORMATS = ["portrait", "square", "landscape"] as const;

export type FrameFormat = (typeof FRAME_FORMATS)[number];

export const FRAME_LABELS: Record<FrameFormat, string> = {
  portrait: "Potret (2:3)",
  square: "Kotak (1:1)",
  landscape: "Lanskap (3:2)",
};

/** width ÷ height of the media window inside the frame. */
export const FRAME_RATIO: Record<FrameFormat, number> = {
  portrait: 2 / 3,
  square: 1,
  landscape: 3 / 2,
};

/** CSS aspect-ratio strings, for chrome that only needs the shape. */
export const FRAME_RATIO_CSS: Record<FrameFormat, string> = {
  portrait: "2 / 3",
  square: "1 / 1",
  landscape: "3 / 2",
};

/**
 * Frame sizes as a named scale, chosen by how many frames share the page —
 * layouts pick a step, they don't invent pixel values.
 */
export const FRAME_SIZE = {
  hero: 292, // one frame owning the page
  cover: 190, // cover, sharing with title + subtitle + quote
  pair: 186, // two frames
  pairStory: 146, // two frames + a story
  trio: 140, // three frames
  trioStory: 118, // three frames + a story
  film: 260, // video, one frame + caption + story
} as const;

export function isFrameFormat(value: string): value is FrameFormat {
  return (FRAME_FORMATS as readonly string[]).includes(value);
}

export function toFrameFormat(value: string | null | undefined): FrameFormat {
  return value && isFrameFormat(value) ? value : "square";
}

/**
 * Media box for a frame, in px.
 *
 * `size` is an **optical** size, not a width or a height: every format is laid
 * out to cover the same area (`size²`), so a portrait photo reads as carrying
 * the same weight as a square or a landscape one. Sizing by equal *height*
 * instead — the previous rule — made portrait frames two-thirds the width of a
 * square, and let landscape frames (1.5× wide) hit the page edge and cap the
 * whole scale, which is why every portrait and square photo looked shrunken.
 *
 * `maxHeight` is the layout's hard ceiling. Portrait is the tallest shape, so
 * without a cap a stack of three could outgrow a fixed-height page; when the
 * cap bites, the frame shrinks along its own ratio rather than being squashed.
 */
export function frameBox(
  size: number,
  format: FrameFormat,
  maxHeight?: number,
): { width: number; height: number } {
  const ratio = FRAME_RATIO[format];
  let width = size * Math.sqrt(ratio);
  let height = width / ratio;
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

/** Classify uploaded media by its pixel dimensions, for a sensible default. */
export function detectFormat(width: number, height: number): FrameFormat {
  if (!width || !height) return "square";
  const ratio = width / height;
  if (ratio >= 1.2) return "landscape";
  if (ratio <= 0.84) return "portrait";
  return "square";
}
