import type { AnchorKind } from "@/lib/v2/templates";
import type { ThemeKey } from "@/lib/v2/themes";

/**
 * A stretch of one layer to draw, in that layer's own design units. `top` is
 * the highest y available above the 720u core band on tall screens (≤ 0), so
 * sky kits can fill it.
 */
export type Span = { x0: number; x1: number; seed: number; top: number };

/** A sticker drawn around (0,0), about 50u across at scale 1. */
export type Sticker = { name: string; draw: () => React.ReactNode };

export type Mount = "bow" | "kraft" | "corners" | "stripes" | "dots";

/**
 * What a kit draws for one layer slice. `bands` are continuous shapes the
 * caller clips to the slice's exact range (they are built on a global grid,
 * so neighbouring slices meet seamlessly); `items` are free-standing pieces
 * owned by the slice that contains their x and never clipped.
 */
export type LayerArt = { bands?: React.ReactNode; items?: React.ReactNode };

export type ThemeKit = {
  key: ThemeKey;
  /** far layer: sun / moon / stars / clouds */
  sky(span: Span): LayerArt;
  /** mid layer: hills, mountains, city, sea */
  mid(span: Span): LayerArt;
  /** ground bands from y≈560 down to 720 */
  ground(span: Span): LayerArt;
  /** deepest front band plus tiny ground stickers */
  front(span: Span): LayerArt;
  stickers: Record<AnchorKind, Sticker[]>;
  mount: Mount;
};

/** Fill helper: CSS variables only resolve reliably through `style`. */
export const fill = (v: string) => ({ fill: v });
export const stroke = (v: string) => ({ stroke: v });
