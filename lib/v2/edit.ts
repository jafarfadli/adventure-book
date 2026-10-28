import { slotSpecs, type TemplateKey } from "./templates";
import type { ThemeKey } from "./themes";
import { emptySlot, type BookV2, type PageV2, type SlotV2 } from "./types";
import { bookStats } from "./visible";

// Pure edits on the client's copy of a book. The editor applies them
// optimistically, sends the same change to the server, and keeps the
// inverse for undo. Every function returns a new object.

export type SlotPatch = Partial<
  Pick<
    SlotV2,
    | "caption"
    | "text"
    | "focusX"
    | "focusY"
    | "dateLabel"
    | "showDate"
    | "takenAt"
    | "lat"
    | "lng"
    | "locationLabel"
    | "locationSource"
    | "imageUrl"
    | "thumbUrl"
    | "videoUrl"
    | "width"
    | "height"
  >
>;

export type BookPatch = Partial<
  Pick<BookV2, "title" | "subtitle" | "volume" | "theme" | "coverImageUrl" | "coverFocusX" | "coverFocusY" | "coverText" | "closingText">
>;

function mapPage(book: BookV2, pageId: string, f: (p: PageV2) => PageV2): BookV2 {
  return withStats(book, book.pages.map((p) => (p.id === pageId ? f(p) : p)));
}

function slotType(key: string): SlotV2["type"] {
  return key.startsWith("video") ? "VIDEO" : key.startsWith("text") ? "TEXT" : "PHOTO";
}

export function patchSlot(book: BookV2, pageId: string, key: string, patch: SlotPatch): BookV2 {
  return mapPage(book, pageId, (p) => ({
    ...p,
    slots: { ...p.slots, [key]: { ...(p.slots[key] ?? emptySlot(key, slotType(key))), ...patch } },
  }));
}

/** The current values of exactly the fields a patch is about to change. */
export function slotPrev(book: BookV2, pageId: string, key: string, patch: SlotPatch): SlotPatch {
  const slot = book.pages.find((p) => p.id === pageId)?.slots[key] ?? emptySlot(key, slotType(key));
  const prev: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) prev[k] = slot[k as keyof SlotV2];
  return prev as SlotPatch;
}

export function setPageTemplate(book: BookV2, pageId: string, template: TemplateKey): BookV2 {
  return mapPage(book, pageId, (p) => {
    const slots = { ...p.slots };
    for (const spec of slotSpecs(template)) slots[spec.key] ??= emptySlot(spec.key, spec.type);
    return { ...p, template, slots };
  });
}

export function setPageTheme(book: BookV2, pageId: string, theme: ThemeKey | null): BookV2 {
  return mapPage(book, pageId, (p) => ({ ...p, ownTheme: theme, theme: theme ?? book.theme }));
}

export function setPageSeed(book: BookV2, pageId: string, seed: number): BookV2 {
  return mapPage(book, pageId, (p) => ({ ...p, decorSeed: seed }));
}

/** The end of the book shows these, so they follow every edit. */
function withStats(book: BookV2, pages: PageV2[]): BookV2 {
  return { ...book, pages, stats: bookStats(pages) };
}

export function insertPages(book: BookV2, index: number, pages: PageV2[]): BookV2 {
  const at = Math.max(0, Math.min(index, book.pages.length));
  return withStats(book, [...book.pages.slice(0, at), ...pages, ...book.pages.slice(at)]);
}

export function removePage(book: BookV2, pageId: string): { book: BookV2; page: PageV2; index: number } {
  const index = book.pages.findIndex((p) => p.id === pageId);
  if (index < 0) throw new Error(`no page ${pageId}`);
  return { book: withStats(book, book.pages.filter((p) => p.id !== pageId)), page: book.pages[index], index };
}

export function reorderPages(book: BookV2, ids: string[]): BookV2 {
  const byId = new Map(book.pages.map((p) => [p.id, p]));
  if (ids.length !== book.pages.length || ids.some((id) => !byId.has(id))) throw new Error("page list out of sync");
  return withStats(book, ids.map((id) => byId.get(id)!));
}

export function patchBook(book: BookV2, patch: BookPatch): BookV2 {
  const next = { ...book, ...patch };
  if (patch.theme && patch.theme !== book.theme) {
    next.pages = book.pages.map((p) => (p.ownTheme ? p : { ...p, theme: patch.theme! }));
  }
  return next;
}

export function bookPrev(book: BookV2, patch: BookPatch): BookPatch {
  const prev: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) prev[k] = book[k as keyof BookV2];
  return prev as BookPatch;
}
