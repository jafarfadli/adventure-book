// v2 theme tokens. A theme is a palette (4 analogous shades + 1 complementary
// accent on a paper base) paired with an asset kit in components/world/themes.
// The palette is the single source for every colour the world draws.

export const THEME_KEYS = ["stroberi", "senja", "matcha", "laut", "lavender"] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeTokens = {
  key: ThemeKey;
  label: string;
  /** Paper base for notes, signs, start/end boards */
  paper: string;
  /** Analogous shades, lightest to deepest */
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  /** The one complementary pop (sun, leaves, tape) */
  accent: string;
  /** Lightest cut paper: clouds, petals, polaroid-adjacent pieces */
  cloud: string;
  /** Sky colour behind the world */
  sky: string;
  /** Darkest band at the very front */
  deep: string;
  /** Handwriting ink on paper */
  ink: string;
  /** Night themes draw stars instead of clouds and light chrome on dark sky */
  night: boolean;
};

export const THEMES: Record<ThemeKey, ThemeTokens> = {
  stroberi: {
    key: "stroberi",
    label: "Stroberi",
    paper: "#fbefe9",
    c1: "#f6c8cf",
    c2: "#ee9db0",
    c3: "#d6688a",
    c4: "#a5436a",
    accent: "#7fae9a",
    cloud: "#fffaf8",
    sky: "#f8d9df",
    deep: "#8c3659",
    ink: "#4a2f38",
    night: false,
  },
  senja: {
    key: "senja",
    label: "Senja",
    paper: "#f7ecd8",
    c1: "#f1d095",
    c2: "#e3a24f",
    c3: "#c96d3b",
    c4: "#93452b",
    accent: "#7f9a54",
    cloud: "#fffaf1",
    sky: "#f5dfb8",
    deep: "#76361f",
    ink: "#4a2a1c",
    night: false,
  },
  matcha: {
    key: "matcha",
    label: "Matcha",
    paper: "#f3efdc",
    c1: "#cfd8ae",
    c2: "#9cb47d",
    c3: "#5f8558",
    c4: "#33553f",
    accent: "#e5876b",
    cloud: "#fffcf0",
    sky: "#e4ead2",
    deep: "#26402f",
    ink: "#2f3b2a",
    night: false,
  },
  laut: {
    key: "laut",
    label: "Laut",
    paper: "#f1e6cf",
    c1: "#b4c8d3",
    c2: "#7c9cbc",
    c3: "#3f6b98",
    c4: "#1f3d62",
    accent: "#e2742c",
    cloud: "#f8f0de",
    sky: "#d3e0e7",
    deep: "#172f4c",
    ink: "#1e2f45",
    night: false,
  },
  lavender: {
    key: "lavender",
    label: "Lavender",
    paper: "#f2edf5",
    c1: "#cec3e5",
    c2: "#a193cd",
    c3: "#6c60a6",
    c4: "#3b356e",
    accent: "#f0c159",
    cloud: "#fdfbff",
    sky: "#3f3974",
    deep: "#2b2752",
    ink: "#2b2650",
    night: true,
  },
};

// v1 stored one of three paper presets on Book.theme.
const LEGACY: Record<string, ThemeKey> = {
  cream: "stroberi",
  dusk: "lavender",
  kraft: "senja",
};

export function isThemeKey(v: unknown): v is ThemeKey {
  return typeof v === "string" && (THEME_KEYS as readonly string[]).includes(v);
}

/** Any stored value (v2 key, v1 preset, junk) to a v2 key. */
export function toThemeKey(v: string | null | undefined, fallback: ThemeKey = "stroberi"): ThemeKey {
  if (isThemeKey(v)) return v;
  if (v && v in LEGACY) return LEGACY[v];
  return fallback;
}

/** Page.theme null (or invalid) means "follow the book". */
export function resolvePageTheme(pageTheme: string | null, bookTheme: string): ThemeKey {
  const book = toThemeKey(bookTheme);
  return isThemeKey(pageTheme) ? pageTheme : book;
}

export function themeCssVars(t: ThemeTokens): Record<string, string> {
  return {
    "--paper": t.paper,
    "--c1": t.c1,
    "--c2": t.c2,
    "--c3": t.c3,
    "--c4": t.c4,
    "--accent": t.accent,
    "--cloud": t.cloud,
    "--sky": t.sky,
    "--deep": t.deep,
    "--ink": t.ink,
  };
}
