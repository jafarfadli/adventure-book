import { describe, expect, test } from "vitest";
import {
  THEME_KEYS,
  THEMES,
  isThemeKey,
  resolvePageTheme,
  themeCssVars,
  toThemeKey,
} from "./themes";

describe("themes", () => {
  test("five themes in the agreed order", () => {
    expect(THEME_KEYS).toEqual(["stroberi", "senja", "matcha", "laut", "lavender"]);
  });

  test("every token is a 7-char hex colour", () => {
    for (const key of THEME_KEYS) {
      const t = THEMES[key];
      for (const c of [t.paper, t.c1, t.c2, t.c3, t.c4, t.accent, t.cloud, t.sky, t.deep, t.ink]) {
        expect(c).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  test("only lavender is a night theme", () => {
    expect(THEME_KEYS.filter((k) => THEMES[k].night)).toEqual(["lavender"]);
  });

  test("legacy v1 keys map to their v2 look-alikes", () => {
    expect(toThemeKey("cream")).toBe("stroberi");
    expect(toThemeKey("dusk")).toBe("lavender");
    expect(toThemeKey("kraft")).toBe("senja");
    expect(toThemeKey("laut")).toBe("laut");
  });

  test("unknown or empty values fall back", () => {
    expect(toThemeKey("neon")).toBe("stroberi");
    expect(toThemeKey(null)).toBe("stroberi");
    expect(toThemeKey(undefined, "matcha")).toBe("matcha");
  });

  test("isThemeKey only accepts v2 keys", () => {
    expect(isThemeKey("senja")).toBe(true);
    expect(isThemeKey("cream")).toBe(false);
    expect(isThemeKey(3)).toBe(false);
  });

  test("a page without its own theme inherits the book's", () => {
    expect(resolvePageTheme(null, "matcha")).toBe("matcha");
    expect(resolvePageTheme("laut", "matcha")).toBe("laut");
    expect(resolvePageTheme(null, "cream")).toBe("stroberi");
    expect(resolvePageTheme("nonsense", "senja")).toBe("senja");
  });

  test("css variables cover every token", () => {
    const vars = themeCssVars(THEMES.senja);
    expect(Object.keys(vars).sort()).toEqual(
      ["--accent", "--c1", "--c2", "--c3", "--c4", "--cloud", "--deep", "--ink", "--paper", "--sky"].sort(),
    );
    expect(vars["--c3"]).toBe(THEMES.senja.c3);
  });
});
