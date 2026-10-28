"use client";

import { stampText } from "@/lib/v2/dates";
import { placeDecorations } from "@/lib/v2/decor";
import { TEMPLATES, cardBox, stripBox, type AnchorKind, type TemplateSpec } from "@/lib/v2/templates";
import { THEMES, themeCssVars } from "@/lib/v2/themes";
import type { PageV2 } from "@/lib/v2/types";
import { CaptionLabel, FilmFrame } from "./items/FilmFrame";
import { Letter, Note, Quote } from "./items/Paper";
import { Polaroid } from "./items/Polaroid";
import { PlaceTag, Stamp } from "./items/Stamp";
import { Strip } from "./items/Strip";
import { rotatedPoint, u } from "./items/units";
import { KITS } from "./themes";

/** Editor hooks for one stop (absent in the reader). */
export type StationEdit = {
  /** "page" (the whole stop), a media key ("photo1", "video1") or "text1" */
  selected: string | null;
  /** the field being typed in place */
  typing: { key: string; field: "caption" | "text" } | null;
  /** media key being re-framed by dragging */
  focusing: string | null;
  onType: (key: string, field: "caption" | "text", value: string) => void;
  onTypeDone: () => void;
  onFocus: (key: string, x: number, y: number, done: boolean) => void;
};

/** Box (with rotation about its own centre) of a selectable thing in a stop. */
function selectionBox(t: TemplateSpec, key: string): { x: number; y: number; w: number; h: number; rot: number } | null {
  if (key === "page") return { x: 4, y: 4, w: t.width - 8, h: 712, rot: 0 };
  if (key === "text1" && t.text) return { x: t.text.x, y: t.text.y, w: t.text.w, h: t.text.h, rot: t.text.rot };
  const f = t.frames.find((fr) => fr.key === key);
  if (!f) return null;
  const b = cardBox(f);
  if (f.inStrip && t.strip) {
    const sb = stripBox(t.strip);
    const c = rotatedPoint(sb, t.strip.rot, b.x - sb.x + b.w / 2, b.y - sb.y + b.h / 2);
    return { x: c.x - b.w / 2, y: c.y - b.h / 2, w: b.w, h: b.h, rot: t.strip.rot };
  }
  return { ...b, rot: f.rot };
}

function Outline({ box, page }: { box: { x: number; y: number; w: number; h: number; rot: number }; page: boolean }) {
  const pad = page ? 0 : 7;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: u(box.x - pad),
        top: u(box.y - pad),
        width: u(box.w + 2 * pad),
        height: u(box.h + 2 * pad),
        transform: `rotate(${box.rot}deg)`,
        border: `${u(3)} dashed rgba(255,255,255,0.95)`,
        borderRadius: u(page ? 22 : 8),
        boxShadow: `0 0 0 ${u(4)} rgba(43,35,38,0.28)`,
      }}
    />
  );
}

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
  edit,
}: {
  page: PageV2;
  /** left edge in world units */
  x?: number;
  /** use thumbnails (far-away stops, tiles) */
  lowRes?: boolean;
  label?: string;
  /** false in previews/tiles: videos do not start */
  interactive?: boolean;
  edit?: StationEdit;
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

  const typingOn = (key: string, field: "caption" | "text") => edit?.typing?.key === key && edit.typing.field === field;
  const textEdit = (key: string, field: "caption" | "text") =>
    edit
      ? { typing: typingOn(key, field), onType: (v: string) => edit.onType(key, field, v), onDone: edit.onTypeDone }
      : undefined;
  const focusFor = (key: string) =>
    edit && edit.focusing === key
      ? { active: true, onFocus: (x: number, y: number, done: boolean) => edit.onFocus(key, x, y, done) }
      : undefined;
  const sel = edit?.selected ? selectionBox(t, edit.selected) : null;

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

      {t.strip && (
        <Strip
          strip={t.strip}
          frames={t.frames}
          slots={page.slots}
          mount={kit.mount}
          lowRes={lowRes}
          caption={textEdit("photo1", "caption")}
          focus={focusFor}
        />
      )}

      {t.frames
        .filter((f) => !f.inStrip)
        .map((f) =>
          f.kind === "video" ? (
            <FilmFrame
              key={f.key}
              frame={f}
              slot={page.slots[f.key]}
              mount={kit.mount}
              lowRes={lowRes}
              interactive={interactive && !edit}
              focus={focusFor(f.key)}
            />
          ) : (
            <Polaroid
              key={f.key}
              frame={f}
              slot={page.slots[f.key]}
              mount={kit.mount}
              lowRes={lowRes}
              caption={textEdit(f.key, "caption")}
              focus={focusFor(f.key)}
            />
          ),
        )}

      {t.captionLabel && (page.slots.video1?.caption || edit) && (
        <CaptionLabel box={t.captionLabel} text={page.slots.video1?.caption ?? ""} edit={textEdit("video1", "caption")} />
      )}

      {t.text?.kind === "note" && <Note spec={t.text} text={page.slots.text1?.text ?? null} mount={kit.mount} edit={textEdit("text1", "text")} />}
      {t.text?.kind === "letter" && <Letter spec={t.text} text={page.slots.text1?.text ?? null} edit={textEdit("text1", "text")} />}
      {t.text?.kind === "quote" && <Quote spec={t.text} text={page.slots.text1?.text ?? null} edit={textEdit("text1", "text")} />}

      {stamp && stampAt && <Stamp x={stampAt.x} y={stampAt.y} day={stamp.day} year={stamp.year} />}
      {place && stampAt && <PlaceTag x={stampAt.x - 150} y={stampAt.y + 30} label={place} />}

      {sel && <Outline box={sel} page={edit?.selected === "page"} />}
    </section>
  );
}
