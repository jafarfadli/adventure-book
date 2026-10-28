"use client";

import { stampText } from "@/lib/v2/dates";
import { placeDecorations } from "@/lib/v2/decor";
import { TEMPLATES, cardBox, type AnchorKind } from "@/lib/v2/templates";
import { THEMES, themeCssVars } from "@/lib/v2/themes";
import type { PageV2 } from "@/lib/v2/types";
import { CaptionLabel, FilmFrame } from "./items/FilmFrame";
import { Letter, Note, Quote } from "./items/Paper";
import { Polaroid } from "./items/Polaroid";
import { PlaceTag, Stamp } from "./items/Stamp";
import { Strip } from "./items/Strip";
import { rotatedPoint, u } from "./items/units";
import { KITS } from "./themes";

/**
 * One stop of the book: the template's frames, text, date stamp, place tag
 * and decorations, positioned in design units (resolved against --u).
 * The reader, the editor and the page tiles all render pages through this
 * component — scenery is drawn separately by the world / StationScene.
 */
export function Station({
  page,
  x = 0,
  lowRes,
  label,
  interactive = true,
}: {
  page: PageV2;
  /** left edge in world units */
  x?: number;
  /** use thumbnails (far-away stops, tiles) */
  lowRes?: boolean;
  label?: string;
  /** false in previews/tiles: videos do not start */
  interactive?: boolean;
}) {
  const t = TEMPLATES[page.template];
  const kit = KITS[page.theme];
  const pools: Record<AnchorKind, number> = {
    sky: kit.stickers.sky.length,
    side: kit.stickers.side.length,
    ground: kit.stickers.ground.length,
  };
  const decor = placeDecorations(t.anchors, pools, page.id, page.decorSeed);

  // date stamp + place tag hang off the template's stamp frame
  const stampFrame = t.stamp ? t.frames.find((f) => f.key === t.stamp!.frame) : undefined;
  const stampSlot = stampFrame ? page.slots[stampFrame.key] : undefined;
  const stamp = stampSlot ? stampText(stampSlot) : null;
  const stampAt =
    t.stamp && stampFrame ? rotatedPoint(cardBox(stampFrame), stampFrame.rot, t.stamp.dx, t.stamp.dy) : null;
  const place = t.frames.map((f) => page.slots[f.key]?.locationLabel).find((l) => l && l.trim());

  return (
    <section
      aria-label={label ?? `Halaman ${page.order + 1}`}
      data-page={page.id}
      className="absolute top-0"
      style={{ left: u(x), width: u(t.width), height: u(720), ...themeCssVars(THEMES[page.theme]) } as React.CSSProperties}
    >
      {decor.map((d, i) => {
        const s = kit.stickers[d.anchor.kind][d.sticker];
        const size = d.anchor.size;
        return (
          <svg
            key={`${s.name}-${i}`}
            aria-hidden
            className="pointer-events-none absolute overflow-visible"
            style={{ left: u(d.anchor.x - size / 2), top: u(d.anchor.y - size / 2), width: u(size), height: u(size) }}
            viewBox="-28 -28 56 56"
          >
            <g transform={`rotate(${d.rot}) scale(${d.scale})`}>{s.draw()}</g>
          </svg>
        );
      })}

      {t.strip && <Strip strip={t.strip} frames={t.frames} slots={page.slots} mount={kit.mount} lowRes={lowRes} />}

      {t.frames
        .filter((f) => !f.inStrip)
        .map((f) =>
          f.kind === "video" ? (
            <FilmFrame key={f.key} frame={f} slot={page.slots[f.key]} mount={kit.mount} lowRes={lowRes} interactive={interactive} />
          ) : (
            <Polaroid key={f.key} frame={f} slot={page.slots[f.key]} mount={kit.mount} lowRes={lowRes} />
          ),
        )}

      {t.captionLabel && page.slots.video1?.caption && <CaptionLabel box={t.captionLabel} text={page.slots.video1.caption} />}

      {t.text?.kind === "note" && <Note spec={t.text} text={page.slots.text1?.text ?? null} mount={kit.mount} />}
      {t.text?.kind === "letter" && <Letter spec={t.text} text={page.slots.text1?.text ?? null} />}
      {t.text?.kind === "quote" && <Quote spec={t.text} text={page.slots.text1?.text ?? null} />}

      {stamp && stampAt && <Stamp x={stampAt.x} y={stampAt.y} day={stamp.day} year={stamp.year} />}
      {place && stampAt && <PlaceTag x={stampAt.x - 150} y={stampAt.y + 30} label={place} />}
    </section>
  );
}
