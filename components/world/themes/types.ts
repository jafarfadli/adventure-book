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

export type ThemeKit = {
  key: ThemeKey;
  /** far layer: sun / moon / stars / clouds */
  sky(span: Span): React.ReactNode;
  /** mid layer: hills, mountains, city, sea */
  mid(span: Span): React.ReactNode;
  /** ground bands from y≈560 down to 720 */
  ground(span: Span): React.ReactNode;
  /** deepest front band plus tiny ground stickers */
  front(span: Span): React.ReactNode;
  stickers: Record<AnchorKind, Sticker[]>;
  mount: Mount;
};

/** Fill helper: CSS variables only resolve reliably through `style`. */
export const fill = (v: string) => ({ fill: v });
export const stroke = (v: string) => ({ stroke: v });
