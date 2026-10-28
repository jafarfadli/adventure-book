import type { Layout } from "@prisma/client";
import { parseIndoDate } from "./dates";
import { resolveTemplate, type TemplateKey } from "./templates";
import { isThemeKey, toThemeKey } from "./themes";

// Pure planners for the one-off v2 backfill. The script (scripts/v2/backfill.ts)
// reads rows, asks these what to change, prints the plan and applies it.
// Every planner only fills empty fields, so running it twice is a no-op.

type SizedSlot = { key: string; width: number | null; height: number | null };

export function planTemplates(
  pages: { id: string; layout: Layout; template: string | null; slots: SizedSlot[] }[],
): { id: string; template: TemplateKey }[] {
  const plan: { id: string; template: TemplateKey }[] = [];
  for (const p of pages) {
    if (p.template !== null) continue;
    const t = resolveTemplate(p);
    if (t) plan.push({ id: p.id, template: t });
  }
  return plan;
}

export function planTakenAt(
  slots: { id: string; dateLabel: string | null; takenAt: Date | null }[],
): { id: string; takenAt: Date }[] {
  const plan: { id: string; takenAt: Date }[] = [];
  for (const s of slots) {
    if (s.takenAt) continue;
    const d = parseIndoDate(s.dateLabel);
    if (d) plan.push({ id: s.id, takenAt: d });
  }
  return plan;
}

type PartPage = { layout: Layout; slots: { key: string; imageUrl: string | null; text: string | null }[] };

export function planBookParts(
  book: { theme: string; coverImageUrl: string | null; coverText: string | null; closingText: string | null },
  pages: PartPage[],
): Partial<{ theme: string; coverImageUrl: string; coverText: string; closingText: string }> {
  const out: Partial<{ theme: string; coverImageUrl: string; coverText: string; closingText: string }> = {};
  if (!isThemeKey(book.theme)) out.theme = toThemeKey(book.theme);

  const cover = pages.find((p) => p.layout === "COVER");
  const coverPhoto = cover?.slots.find((s) => s.key === "photo1")?.imageUrl;
  const coverText = cover?.slots.find((s) => s.key === "text1")?.text?.trim();
  if (!book.coverImageUrl && coverPhoto) out.coverImageUrl = coverPhoto;
  if (!book.coverText && coverText) out.coverText = coverText;

  const closing = pages.find((p) => p.layout === "CLOSING");
  const closingText = closing?.slots.find((s) => s.key === "text1")?.text?.trim();
  if (!book.closingText && closingText) out.closingText = closingText;

  return out;
}

/** "<base>/api/media/<name>" → "<name>", or null for anything we did not write. */
export function mediaFileName(url: string | null): string | null {
  if (!url) return null;
  const m = /\/api\/media\/([A-Za-z0-9-]+(?:\.thumb)?\.(?:webp|mp4))$/.exec(url);
  return m ? m[1] : null;
}
