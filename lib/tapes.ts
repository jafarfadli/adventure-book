// Washi tape presets keyed by Slot.tapeStyle. Single source of truth for the
// reader frame and the editor picker.
export const TAPE_STYLES: Record<string, { label: string; className: string }> = {
  classic: { label: "Krem", className: "bg-amber-100/70" },
  pink: { label: "Pink", className: "bg-rose-200/70" },
  mint: { label: "Mint", className: "bg-emerald-200/60" },
  striped: {
    label: "Garis-garis",
    className:
      "bg-[repeating-linear-gradient(45deg,rgba(244,114,182,0.5)_0_6px,rgba(255,247,237,0.75)_6px_12px)]",
  },
  dotted: {
    label: "Polkadot",
    className:
      "bg-sky-200/70 [background-image:radial-gradient(rgba(255,255,255,0.95)_1.5px,transparent_1.5px)] [background-size:8px_8px]",
  },
};

export function isTapeStyle(value: string): boolean {
  return value in TAPE_STYLES;
}
