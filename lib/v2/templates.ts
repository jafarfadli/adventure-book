import type { Layout } from "@prisma/client";

// The 12 v2 templates: the single source of truth for frame shapes, sizes,
// positions, decoration anchors and the picker glyph. The reader, the editor
// (overlays, hit areas) and the page tiles all read from here.
//
// Coordinates are design units (u) inside one stop ("station"): every station
// is 720u tall and TemplateSpec.width wide; the ground band starts ~560u.

export const TEMPLATE_KEYS = [
  "single-tall",
  "single-wide",
  "duo-side",
  "duo-stack",
  "trio",
  "photo-text",
  "duo-text",
  "strip-text",
  "video-tall",
  "video-wide",
  "letter",
  "quote",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Ratio = "3:4" | "4:3" | "1:1" | "9:16" | "16:9";
export type MediaKey = "photo1" | "photo2" | "photo3" | "video1";

export type FrameSpec = {
  key: MediaKey;
  kind: "photo" | "video";
  ratio: Ratio;
  /** Media window width in u (the photo itself, not the paper around it). */
  w: number;
  /** Top-left of the card / film frame (or of the cell, inside a strip). */
  x: number;
  y: number;
  rot: number;
  /** Photobooth-strip cells: drawn by the strip, not as polaroids. */
  inStrip?: boolean;
};

export type TextSpec = {
  key: "text1";
  kind: "note" | "letter" | "quote";
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  maxLines: number;
};

export type StripSpec = { x: number; y: number; rot: number; cell: number };

export type AnchorKind = "sky" | "side" | "ground";
export type Anchor = { x: number; y: number; kind: AnchorKind; size: number };

export type TemplateSpec = {
  key: TemplateKey;
  label: string;
  width: number;
  legacy: Layout;
  frames: FrameSpec[];
  text?: TextSpec;
  strip?: StripSpec;
  /** Video caption label (paper strip under the film). */
  captionLabel?: { x: number; y: number; w: number; h: number; rot: number };
  anchors: Anchor[];
  /** Date stamp centre, relative to a frame's box top-left. */
  stamp?: { frame: MediaKey; dx: number; dy: number };
  /** Picker pictogram: SVG inner markup for viewBox "0 0 30 22", fill = currentColor. */
  glyph: string;
};

const POLAROID_PAD = 12;
const POLAROID_CAPTION = 46;
const FILM_SPROCKET = 28;
const STRIP_PAD = 12;
const STRIP_GAP = 10;
const STRIP_FOOT = 34;

const LINE = 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round"';

function strip(x: number, y: number, rot: number, cell: number): { strip: StripSpec; frames: FrameSpec[] } {
  const keys: MediaKey[] = ["photo1", "photo2", "photo3"];
  return {
    strip: { x, y, rot, cell },
    frames: keys.map((key, i) => ({
      key,
      kind: "photo",
      ratio: "1:1",
      w: cell,
      x: x + STRIP_PAD,
      y: y + STRIP_PAD + i * (cell + STRIP_GAP),
      rot,
      inStrip: true,
    })),
  };
}

const STRIP_TEXT = strip(30, 60, -2.5, 146);

export const TEMPLATES: Record<TemplateKey, TemplateSpec> = {
  "single-tall": {
    key: "single-tall",
    label: "Satu foto tegak",
    width: 380,
    legacy: "SINGLE",
    frames: [{ key: "photo1", kind: "photo", ratio: "3:4", w: 276, x: 40, y: 110, rot: -1.5 }],
    anchors: [
      { x: 64, y: 58, kind: "sky", size: 56 },
      { x: 300, y: 50, kind: "sky", size: 50 },
      { x: 374, y: 330, kind: "side", size: 44 },
      { x: 70, y: 662, kind: "ground", size: 54 },
      { x: 300, y: 670, kind: "ground", size: 48 },
    ],
    stamp: { frame: "photo1", dx: 284, dy: 352 },
    glyph: `<rect x="11" y="2" width="8" height="12" rx="1"/><path d="M12 17.5 H18" ${LINE}/>`,
  },
  "single-wide": {
    key: "single-wide",
    label: "Satu foto lebar",
    width: 500,
    legacy: "SINGLE",
    frames: [{ key: "photo1", kind: "photo", ratio: "4:3", w: 396, x: 40, y: 150, rot: 1.5 }],
    anchors: [
      { x: 92, y: 72, kind: "sky", size: 56 },
      { x: 420, y: 78, kind: "sky", size: 64 },
      { x: 250, y: 560, kind: "side", size: 40 },
      { x: 80, y: 662, kind: "ground", size: 54 },
      { x: 430, y: 668, kind: "ground", size: 50 },
    ],
    stamp: { frame: "photo1", dx: 404, dy: 282 },
    glyph: '<rect x="5" y="4" width="20" height="13" rx="1"/>',
  },
  "duo-side": {
    key: "duo-side",
    label: "Dua foto berdampingan",
    width: 500,
    legacy: "DUO",
    frames: [
      { key: "photo1", kind: "photo", ratio: "3:4", w: 186, x: 30, y: 150, rot: -2.5 },
      { key: "photo2", kind: "photo", ratio: "3:4", w: 186, x: 260, y: 190, rot: 2 },
    ],
    anchors: [
      { x: 140, y: 80, kind: "sky", size: 54 },
      { x: 400, y: 92, kind: "sky", size: 60 },
      { x: 250, y: 118, kind: "side", size: 40 },
      { x: 245, y: 532, kind: "side", size: 44 },
      { x: 60, y: 662, kind: "ground", size: 54 },
      { x: 440, y: 668, kind: "ground", size: 50 },
    ],
    stamp: { frame: "photo1", dx: 196, dy: 236 },
    glyph: '<rect x="4" y="3" width="10" height="13" rx="1"/><rect x="16" y="6" width="10" height="13" rx="1"/>',
  },
  "duo-stack": {
    key: "duo-stack",
    label: "Dua foto bertumpuk",
    width: 460,
    legacy: "DUO",
    frames: [
      { key: "photo1", kind: "photo", ratio: "4:3", w: 266, x: 30, y: 50, rot: -2 },
      { key: "photo2", kind: "photo", ratio: "4:3", w: 266, x: 140, y: 300, rot: 2.5 },
    ],
    anchors: [
      { x: 400, y: 72, kind: "sky", size: 56 },
      { x: 392, y: 200, kind: "side", size: 50 },
      { x: 72, y: 400, kind: "side", size: 48 },
      { x: 62, y: 664, kind: "ground", size: 52 },
      { x: 430, y: 670, kind: "ground", size: 46 },
    ],
    stamp: { frame: "photo2", dx: 276, dy: 186 },
    glyph: '<rect x="4" y="1.5" width="15" height="9" rx="1"/><rect x="11" y="11.5" width="15" height="9" rx="1"/>',
  },
  trio: {
    key: "trio",
    label: "Tiga foto",
    width: 600,
    legacy: "TRIO",
    frames: [
      { key: "photo1", kind: "photo", ratio: "4:3", w: 276, x: 30, y: 130, rot: -2 },
      { key: "photo2", kind: "photo", ratio: "1:1", w: 166, x: 350, y: 80, rot: 3 },
      { key: "photo3", kind: "photo", ratio: "1:1", w: 166, x: 370, y: 320, rot: -2.5 },
    ],
    anchors: [
      { x: 120, y: 70, kind: "sky", size: 54 },
      { x: 584, y: 40, kind: "sky", size: 40 },
      { x: 110, y: 472, kind: "side", size: 48 },
      { x: 330, y: 470, kind: "side", size: 40 },
      { x: 60, y: 664, kind: "ground", size: 52 },
      { x: 560, y: 668, kind: "ground", size: 48 },
    ],
    stamp: { frame: "photo1", dx: 286, dy: 196 },
    glyph:
      '<rect x="3" y="3" width="13" height="10" rx="1"/><rect x="18" y="2" width="9" height="9" rx="1"/><rect x="18" y="12.5" width="9" height="9" rx="1"/>',
  },
  "photo-text": {
    key: "photo-text",
    label: "Foto + cerita",
    width: 590,
    legacy: "PHOTO_TEXT",
    frames: [{ key: "photo1", kind: "photo", ratio: "3:4", w: 226, x: 30, y: 110, rot: -2.5 }],
    text: { key: "text1", kind: "note", x: 300, y: 260, w: 250, h: 240, rot: 2, maxLines: 7 },
    anchors: [
      { x: 400, y: 110, kind: "sky", size: 64 },
      { x: 550, y: 60, kind: "sky", size: 44 },
      { x: 580, y: 200, kind: "side", size: 36 },
      { x: 92, y: 520, kind: "side", size: 46 },
      { x: 60, y: 664, kind: "ground", size: 52 },
      { x: 520, y: 670, kind: "ground", size: 48 },
    ],
    stamp: { frame: "photo1", dx: 234, dy: 286 },
    glyph: `<rect x="3" y="3" width="10" height="14" rx="1"/><path d="M16 6 H27 M16 10 H27 M16 14 H23" ${LINE}/>`,
  },
  "duo-text": {
    key: "duo-text",
    label: "Dua foto + cerita",
    width: 480,
    legacy: "DUO_TEXT",
    frames: [
      { key: "photo1", kind: "photo", ratio: "1:1", w: 166, x: 30, y: 70, rot: -3 },
      { key: "photo2", kind: "photo", ratio: "1:1", w: 166, x: 250, y: 90, rot: 2.5 },
    ],
    text: { key: "text1", kind: "note", x: 40, y: 340, w: 400, h: 190, rot: -1, maxLines: 4 },
    anchors: [
      { x: 235, y: 38, kind: "sky", size: 40 },
      { x: 455, y: 48, kind: "sky", size: 40 },
      { x: 472, y: 420, kind: "side", size: 40 },
      { x: 60, y: 664, kind: "ground", size: 50 },
      { x: 430, y: 668, kind: "ground", size: 48 },
    ],
    stamp: { frame: "photo1", dx: 176, dy: 150 },
    glyph: `<rect x="4" y="2" width="10" height="9" rx="1"/><rect x="16" y="2" width="10" height="9" rx="1"/><path d="M5 15 H25 M5 19 H19" ${LINE}/>`,
  },
  "strip-text": {
    key: "strip-text",
    label: "Strip photobooth + cerita",
    width: 500,
    legacy: "TRIO_TEXT",
    frames: STRIP_TEXT.frames,
    strip: STRIP_TEXT.strip,
    text: { key: "text1", kind: "note", x: 230, y: 170, w: 240, h: 280, rot: 2, maxLines: 7 },
    anchors: [
      { x: 350, y: 82, kind: "sky", size: 60 },
      { x: 470, y: 48, kind: "sky", size: 40 },
      { x: 332, y: 512, kind: "side", size: 48 },
      { x: 110, y: 686, kind: "ground", size: 40 },
      { x: 300, y: 664, kind: "ground", size: 52 },
      { x: 460, y: 668, kind: "ground", size: 46 },
    ],
    glyph: `<rect x="5" y="1" width="7" height="6" rx="1"/><rect x="5" y="8" width="7" height="6" rx="1"/><rect x="5" y="15" width="7" height="6" rx="1"/><path d="M16 6 H26 M16 10 H26 M16 14 H22" ${LINE}/>`,
  },
  "video-tall": {
    key: "video-tall",
    label: "Video tegak",
    width: 360,
    legacy: "VIDEO",
    frames: [{ key: "video1", kind: "video", ratio: "9:16", w: 216, x: 40, y: 80, rot: -1.5 }],
    captionLabel: { x: 76, y: 506, w: 200, h: 44, rot: -2 },
    anchors: [
      { x: 336, y: 40, kind: "sky", size: 36 },
      { x: 344, y: 300, kind: "side", size: 36 },
      { x: 330, y: 530, kind: "side", size: 40 },
      { x: 60, y: 664, kind: "ground", size: 50 },
      { x: 320, y: 668, kind: "ground", size: 46 },
    ],
    stamp: { frame: "video1", dx: 262, dy: 402 },
    glyph:
      '<rect x="10" y="1" width="10" height="20" rx="1.5"/><path d="M12 3 V19 M18 3 V19" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="1.6 1.6"/>',
  },
  "video-wide": {
    key: "video-wide",
    label: "Video lebar",
    width: 490,
    legacy: "VIDEO",
    frames: [{ key: "video1", kind: "video", ratio: "16:9", w: 400, x: 30, y: 170, rot: 1.5 }],
    captionLabel: { x: 130, y: 466, w: 200, h: 44, rot: -1.5 },
    anchors: [
      { x: 100, y: 90, kind: "sky", size: 56 },
      { x: 400, y: 80, kind: "sky", size: 64 },
      { x: 420, y: 500, kind: "side", size: 44 },
      { x: 60, y: 664, kind: "ground", size: 50 },
      { x: 440, y: 668, kind: "ground", size: 46 },
    ],
    stamp: { frame: "video1", dx: 414, dy: 271 },
    glyph:
      '<rect x="3" y="4" width="24" height="14" rx="1.5"/><path d="M5 6 H25 M5 16 H25" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="1.6 1.6"/>',
  },
  letter: {
    key: "letter",
    label: "Surat",
    width: 400,
    legacy: "TEXT",
    frames: [],
    text: { key: "text1", kind: "letter", x: 30, y: 60, w: 330, h: 450, rot: -2, maxLines: 10 },
    anchors: [
      { x: 390, y: 40, kind: "sky", size: 32 },
      { x: 392, y: 300, kind: "side", size: 28 },
      { x: 60, y: 664, kind: "ground", size: 50 },
      { x: 340, y: 668, kind: "ground", size: 46 },
    ],
    glyph:
      '<rect x="7" y="1" width="16" height="20" rx="1"/><path d="M10 6 H20 M10 10 H20 M10 14 H17" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round"/>',
  },
  quote: {
    key: "quote",
    label: "Kutipan",
    width: 440,
    legacy: "QUOTE",
    frames: [],
    text: { key: "text1", kind: "quote", x: 20, y: 190, w: 400, h: 260, rot: 0, maxLines: 3 },
    anchors: [
      { x: 90, y: 100, kind: "sky", size: 54 },
      { x: 380, y: 110, kind: "sky", size: 50 },
      { x: 60, y: 500, kind: "side", size: 44 },
      { x: 400, y: 490, kind: "side", size: 40 },
      { x: 60, y: 664, kind: "ground", size: 50 },
      { x: 400, y: 668, kind: "ground", size: 46 },
    ],
    glyph: '<path d="M7 16 C3 16 3 9 8 8 C9 5 14 4 16 7 C19 5 25 7 24 11 C28 12 27 17 23 17 Z"/>',
  },
};

/** The envelope pocket in front of a letter (part of the template's footprint). */
export const LETTER_POCKET = { dx: -10, dy: 360, w: 360, h: 150 };

export function isTemplateKey(v: unknown): v is TemplateKey {
  return typeof v === "string" && (TEMPLATE_KEYS as readonly string[]).includes(v);
}

export function ratioValue(r: Ratio): number {
  const [w, h] = r.split(":").map(Number);
  return w / h;
}

export function windowSize(f: FrameSpec): { w: number; h: number } {
  return { w: f.w, h: Math.round(f.w / ratioValue(f.ratio)) };
}

/** The paper (polaroid) or film around a frame, unrotated. */
export function cardBox(f: FrameSpec): { x: number; y: number; w: number; h: number } {
  const win = windowSize(f);
  if (f.inStrip) return { x: f.x, y: f.y, w: win.w, h: win.h };
  if (f.kind === "video") {
    const portrait = ratioValue(f.ratio) < 1;
    // sprockets run along the long edges
    return portrait
      ? { x: f.x, y: f.y, w: win.w + 2 * FILM_SPROCKET, h: win.h + 28 }
      : { x: f.x, y: f.y, w: win.w + 24, h: win.h + 2 * FILM_SPROCKET };
  }
  return { x: f.x, y: f.y, w: win.w + 2 * POLAROID_PAD, h: win.h + POLAROID_PAD + POLAROID_CAPTION };
}

/** Offset of the media window inside its card/film. */
export function windowOffset(f: FrameSpec): { dx: number; dy: number } {
  if (f.inStrip) return { dx: 0, dy: 0 };
  if (f.kind === "video") {
    return ratioValue(f.ratio) < 1 ? { dx: FILM_SPROCKET, dy: 14 } : { dx: 12, dy: FILM_SPROCKET };
  }
  return { dx: POLAROID_PAD, dy: POLAROID_PAD };
}

export function stripBox(s: StripSpec): { x: number; y: number; w: number; h: number } {
  return {
    x: s.x,
    y: s.y,
    w: s.cell + 2 * STRIP_PAD,
    h: 2 * STRIP_PAD + 3 * s.cell + 2 * STRIP_GAP + STRIP_FOOT,
  };
}

export type Box = { x: number; y: number; w: number; h: number; rot: number; what: string };

/** Every solid thing a template draws (for hit areas and layout invariants). */
export function templateBoxes(t: TemplateSpec): Box[] {
  const boxes: Box[] = [];
  for (const f of t.frames) {
    if (f.inStrip) continue;
    boxes.push({ ...cardBox(f), rot: f.rot, what: f.key });
  }
  if (t.strip) boxes.push({ ...stripBox(t.strip), rot: t.strip.rot, what: "strip" });
  if (t.text) {
    const { x, y, w, h, rot } = t.text;
    boxes.push({ x, y, w, h, rot, what: "text1" });
    if (t.text.kind === "letter") {
      boxes.push({ x: x + LETTER_POCKET.dx, y: y + LETTER_POCKET.dy, w: LETTER_POCKET.w, h: LETTER_POCKET.h, rot: 0, what: "pocket" });
    }
  }
  if (t.captionLabel) boxes.push({ ...t.captionLabel, what: "caption" });
  return boxes;
}

/** Axis-aligned bounds of a box rotated about its centre. */
export function rotatedBounds(b: Box): { x0: number; y0: number; x1: number; y1: number } {
  const r = (Math.abs(b.rot) * Math.PI) / 180;
  const w = b.w * Math.cos(r) + b.h * Math.sin(r);
  const h = b.w * Math.sin(r) + b.h * Math.cos(r);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
}

export type SlotKind = "PHOTO" | "VIDEO" | "TEXT";

/** The slot rows a page with this template should have. */
export function slotSpecs(t: TemplateKey): { key: string; type: SlotKind }[] {
  const spec = TEMPLATES[t];
  const rows: { key: string; type: SlotKind }[] = spec.frames.map((f) => ({
    key: f.key,
    type: f.kind === "video" ? "VIDEO" : "PHOTO",
  }));
  if (spec.text) rows.push({ key: "text1", type: "TEXT" });
  return rows;
}

type SizedSlot = { key: string; width: number | null; height: number | null };

function shape(slots: SizedSlot[], key: string): "portrait" | "landscape" | null {
  const s = slots.find((x) => x.key === key);
  if (!s || !s.width || !s.height) return null;
  return s.width > s.height ? "landscape" : "portrait";
}

/**
 * Template for a v1 page (Page.template still null). Picks the orientation
 * variant from the stored media's real pixel size, which is what readers see
 * — not the frame format the couple once chose in v1.
 */
export function deriveTemplate(layout: Layout, slots: SizedSlot[]): TemplateKey | null {
  switch (layout) {
    case "SINGLE":
      return shape(slots, "photo1") === "landscape" ? "single-wide" : "single-tall";
    case "DUO":
      return shape(slots, "photo1") === "landscape" && shape(slots, "photo2") === "landscape"
        ? "duo-stack"
        : "duo-side";
    case "TRIO":
      return "trio";
    case "PHOTO_TEXT":
      return "photo-text";
    case "DUO_TEXT":
      return "duo-text";
    case "TRIO_TEXT":
      return "strip-text";
    case "VIDEO":
      return shape(slots, "video1") === "portrait" ? "video-tall" : "video-wide";
    case "TEXT":
      return "letter";
    case "QUOTE":
      return "quote";
  }
}

export function resolveTemplate(page: { template: string | null; layout: Layout; slots: SizedSlot[] }): TemplateKey | null {
  return isTemplateKey(page.template) ? page.template : deriveTemplate(page.layout, page.slots);
}
