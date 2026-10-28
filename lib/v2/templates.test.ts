import { describe, expect, test } from "vitest";
import {
  TEMPLATE_KEYS,
  TEMPLATES,
  cardBox,
  deriveTemplate,
  isTemplateKey,
  resolveTemplate,
  rotatedBounds,
  slotSpecs,
  stripBox,
  templateBoxes,
  windowSize,
} from "./templates";

const portrait = (key: string) => ({ key, width: 1200, height: 1600 });
const landscape = (key: string) => ({ key, width: 1600, height: 1200 });

describe("registry", () => {
  test("12 templates in picker order, keys match", () => {
    expect(TEMPLATE_KEYS).toHaveLength(12);
    for (const k of TEMPLATE_KEYS) expect(TEMPLATES[k].key).toBe(k);
  });

  test("window sizes follow the ratios", () => {
    expect(windowSize(TEMPLATES["single-tall"].frames[0])).toEqual({ w: 276, h: 368 });
    expect(windowSize(TEMPLATES["single-wide"].frames[0])).toEqual({ w: 396, h: 297 });
    expect(windowSize(TEMPLATES["video-tall"].frames[0])).toEqual({ w: 216, h: 384 });
    expect(windowSize(TEMPLATES["video-wide"].frames[0])).toEqual({ w: 400, h: 225 });
  });

  test("polaroid and film boxes match the spec", () => {
    expect(cardBox(TEMPLATES["single-tall"].frames[0])).toEqual({ x: 40, y: 110, w: 300, h: 426 });
    expect(cardBox(TEMPLATES["video-tall"].frames[0])).toEqual({ x: 40, y: 80, w: 272, h: 412 });
    expect(cardBox(TEMPLATES["video-wide"].frames[0])).toEqual({ x: 30, y: 170, w: 424, h: 281 });
  });
});

describe.each(TEMPLATE_KEYS)("%s layout invariants", (key) => {
  const t = TEMPLATES[key];
  const boxes = templateBoxes(t);

  test("everything solid stays inside the station", () => {
    for (const b of boxes) {
      const r = rotatedBounds(b);
      expect(r.x0, `${b.what} left`).toBeGreaterThanOrEqual(-6);
      expect(r.x1, `${b.what} right`).toBeLessThanOrEqual(t.width + 6);
      expect(r.y0, `${b.what} top`).toBeGreaterThanOrEqual(0);
      expect(r.y1, `${b.what} bottom`).toBeLessThanOrEqual(720);
    }
  });

  test("decoration anchors sit in free space", () => {
    expect(t.anchors.length).toBeGreaterThanOrEqual(4);
    for (const a of t.anchors) {
      const ax0 = a.x - a.size / 2;
      const ax1 = a.x + a.size / 2;
      const ay0 = a.y - a.size / 2;
      const ay1 = a.y + a.size / 2;
      expect(ax0).toBeGreaterThanOrEqual(-35);
      expect(ax1).toBeLessThanOrEqual(t.width + 35);
      expect(ay0).toBeGreaterThanOrEqual(0);
      expect(ay1).toBeLessThanOrEqual(720);
      for (const b of boxes) {
        const r = rotatedBounds(b);
        const m = 6;
        const overlaps = ax0 < r.x1 + m && ax1 > r.x0 - m && ay0 < r.y1 + m && ay1 > r.y0 - m;
        expect(overlaps, `anchor (${a.x},${a.y}) hits ${b.what}`).toBe(false);
      }
    }
  });

  test("slot keys are unique and match the frames", () => {
    const rows = slotSpecs(key);
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
    expect(rows.filter((r) => r.type !== "TEXT").length).toBe(t.frames.length);
  });

  test("the picker glyph is non-empty markup", () => {
    expect(t.glyph).toMatch(/<(rect|path)/);
  });
});

test("photobooth cells sit inside their strip", () => {
  const t = TEMPLATES["strip-text"];
  const s = stripBox(t.strip!);
  for (const f of t.frames) {
    const b = cardBox(f);
    expect(b.x).toBeGreaterThanOrEqual(s.x);
    expect(b.y).toBeGreaterThanOrEqual(s.y);
    expect(b.x + b.w).toBeLessThanOrEqual(s.x + s.w);
    expect(b.y + b.h).toBeLessThanOrEqual(s.y + s.h);
  }
});

describe("legacy mapping", () => {
  test("single photo by its real shape", () => {
    expect(deriveTemplate("SINGLE", [portrait("photo1")])).toBe("single-tall");
    expect(deriveTemplate("SINGLE", [landscape("photo1")])).toBe("single-wide");
    expect(deriveTemplate("SINGLE", [{ key: "photo1", width: null, height: null }])).toBe("single-tall");
  });

  test("two photos stack only when both are landscape", () => {
    expect(deriveTemplate("DUO", [landscape("photo1"), landscape("photo2")])).toBe("duo-stack");
    expect(deriveTemplate("DUO", [landscape("photo1"), portrait("photo2")])).toBe("duo-side");
    expect(deriveTemplate("DUO", [portrait("photo1"), portrait("photo2")])).toBe("duo-side");
  });

  test("video by the poster's shape", () => {
    expect(deriveTemplate("VIDEO", [{ key: "video1", width: 720, height: 1280 }])).toBe("video-tall");
    expect(deriveTemplate("VIDEO", [{ key: "video1", width: 1280, height: 720 }])).toBe("video-wide");
  });

  test("one-to-one families and book parts", () => {
    expect(deriveTemplate("TRIO", [])).toBe("trio");
    expect(deriveTemplate("PHOTO_TEXT", [])).toBe("photo-text");
    expect(deriveTemplate("DUO_TEXT", [])).toBe("duo-text");
    expect(deriveTemplate("TRIO_TEXT", [])).toBe("strip-text");
    expect(deriveTemplate("TEXT", [])).toBe("letter");
    expect(deriveTemplate("QUOTE", [])).toBe("quote");
    expect(deriveTemplate("COVER", [])).toBeNull();
    expect(deriveTemplate("CLOSING", [])).toBeNull();
  });

  test("every template maps back to its own legacy family", () => {
    for (const k of TEMPLATE_KEYS) {
      const t = TEMPLATES[k];
      const dims = t.frames.map((f) =>
        f.ratio === "4:3" || f.ratio === "16:9" ? landscape(f.key) : portrait(f.key),
      );
      const derived = deriveTemplate(t.legacy, dims)!;
      expect(TEMPLATES[derived].legacy).toBe(t.legacy);
    }
  });

  test("a stored v2 template wins; junk falls back to the legacy mapping", () => {
    expect(resolveTemplate({ template: "trio", layout: "DUO", slots: [] })).toBe("trio");
    expect(resolveTemplate({ template: "bogus", layout: "SINGLE", slots: [landscape("photo1")] })).toBe("single-wide");
    expect(resolveTemplate({ template: "trio", layout: "COVER", slots: [] })).toBeNull();
    expect(isTemplateKey("quote")).toBe(true);
    expect(isTemplateKey("QUOTE")).toBe(false);
  });
});
