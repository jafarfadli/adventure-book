// Theme presets keyed by Book.theme. Tailwind classes + raw colors the
// reader needs; keep to 2-3 presets for v1.
export type Theme = {
  /** Backdrop behind the book */
  backdrop: string;
  /** Paper surface of a page */
  paper: string;
  /** Primary handwriting/ink color */
  ink: string;
  /** Softer secondary ink */
  inkSoft: string;
  /** Accent (date stamps, small flourishes) */
  accent: string;
};

export const THEMES: Record<string, Theme> = {
  cream: {
    backdrop: "bg-[#e3d5bc]",
    paper: "bg-[#f5eddb]",
    ink: "text-stone-800",
    inkSoft: "text-stone-500",
    accent: "text-rose-700/80",
  },
  dusk: {
    backdrop: "bg-[#c7bfd6]",
    paper: "bg-[#efeaf4]",
    ink: "text-slate-800",
    inkSoft: "text-slate-500",
    accent: "text-purple-800/70",
  },
  kraft: {
    backdrop: "bg-[#b39b78]",
    paper: "bg-[#d9c6a5]",
    ink: "text-stone-900",
    inkSoft: "text-stone-600",
    accent: "text-amber-900/80",
  },
};

export function getTheme(key: string): Theme {
  return THEMES[key] ?? THEMES.cream;
}
