"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { MEDIA_PATH_RE, VIDEO_PATH_RE } from "@/lib/basePath";
import { prisma } from "@/lib/db";
import { pageSelect, toPageV2 } from "@/lib/v2/load";
import { TEMPLATE_KEYS, TEMPLATES, resolveTemplate, slotSpecs } from "@/lib/v2/templates";
import { THEME_KEYS, toThemeKey } from "@/lib/v2/themes";
import type { PageV2 } from "@/lib/v2/types";

// v2 editor mutations. Every one validates its input, checks the editor
// session for the page's book before touching anything, keeps the legacy
// Page.layout in step with the v2 template (so the v1 app still renders the
// book during the parallel period) and keeps Page.order contiguous.

const id = z.string().min(1).max(64);
const templateKey = z.enum(TEMPLATE_KEYS);
const themeKey = z.enum(THEME_KEYS);
const text = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => (v.trim() === "" ? null : v))
    .nullable();
const unit = z.number().min(0).max(1);

const slotPatchSchema = z
  .object({
    caption: text(300),
    text: z
      .string()
      .max(5000)
      .transform((v) => (v.trim() === "" ? null : v))
      .nullable(),
    focusX: unit,
    focusY: unit,
    dateLabel: text(60),
    showDate: z.boolean(),
    takenAt: z.string().datetime().nullable(),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    locationLabel: text(120),
    locationSource: z.enum(["exif", "manual"]).nullable(),
    imageUrl: z.string().regex(MEDIA_PATH_RE).nullable(),
    thumbUrl: z.string().regex(MEDIA_PATH_RE).nullable(),
    videoUrl: z.string().regex(VIDEO_PATH_RE).nullable(),
    width: z.number().int().positive().max(40000).nullable(),
    height: z.number().int().positive().max(40000).nullable(),
  })
  .partial()
  .strict();

export type SlotPatchInput = z.input<typeof slotPatchSchema>;

function toSlotData(patch: z.output<typeof slotPatchSchema>): Prisma.SlotUncheckedUpdateInput {
  const { takenAt, ...rest } = patch;
  return { ...rest, ...(takenAt !== undefined ? { takenAt: takenAt ? new Date(takenAt) : null } : {}) };
}

function revalidate(slug: string) {
  revalidatePath(`/book/${slug}`);
  revalidatePath(`/book/${slug}/edit`);
}

async function pageForEdit(pageId: string) {
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: {
      id: true,
      bookId: true,
      layout: true,
      template: true,
      book: { select: { slug: true, theme: true } },
      slots: { select: { key: true, width: true, height: true, locationSource: true } },
    },
  });
  await requireEditor(page.bookId);
  return page;
}

type Tx = Prisma.TransactionClient;

/** Rewrite the full page order of a book in two passes (the [bookId, order] pair is unique). */
async function writeOrder(tx: Tx, ids: string[]) {
  for (const [i, pid] of ids.entries()) await tx.page.update({ where: { id: pid }, data: { order: -(i + 1) } });
  for (const [i, pid] of ids.entries()) await tx.page.update({ where: { id: pid }, data: { order: i } });
}

/**
 * Full page order with `newIds` inserted before the stop at `index`. Book
 * parts (v1 COVER/CLOSING rows) keep their places at the two ends.
 */
async function orderWithInsert(tx: Tx, bookId: string, index: number, newIds: string[]): Promise<string[]> {
  const all = await tx.page.findMany({
    where: { bookId, id: { notIn: newIds } },
    orderBy: { order: "asc" },
    select: { id: true, layout: true },
  });
  const stops = all.filter((p) => p.layout !== "COVER" && p.layout !== "CLOSING");
  const before = stops[index];
  const ids = all.map((p) => p.id);
  let at: number;
  if (before) at = ids.indexOf(before.id);
  else {
    const lastStop = stops[stops.length - 1];
    at = lastStop ? ids.indexOf(lastStop.id) + 1 : all.filter((p) => p.layout === "COVER").length;
  }
  return [...ids.slice(0, at), ...newIds, ...ids.slice(at)];
}

async function loadPages(bookId: string, ids: string[], bookTheme: string): Promise<PageV2[]> {
  const rows = await prisma.page.findMany({ where: { bookId, id: { in: ids } }, select: pageSelect });
  return ids.map((pid) => toPageV2(rows.find((r) => r.id === pid)!, bookTheme)!).filter(Boolean);
}

// ---------------------------------------------------------------------------

export async function updateSlotV2(pageIdRaw: string, keyRaw: string, patchRaw: SlotPatchInput) {
  const pageId = id.parse(pageIdRaw);
  const key = z.string().min(1).max(20).parse(keyRaw);
  const patch = slotPatchSchema.parse(patchRaw);
  const page = await pageForEdit(pageId);

  const template = resolveTemplate(page);
  const spec = template ? slotSpecs(template).find((s) => s.key === key) : undefined;
  const existing = page.slots.find((s) => s.key === key);
  if (!spec && !existing) throw new Error(`Slot "${key}" is not part of this page`);

  // a new (or removed) file never moves a pin the couple placed by hand;
  // only an explicit location edit does (including undoing one)
  const fileChange = "imageUrl" in patch || "videoUrl" in patch;
  if (fileChange && existing?.locationSource === "manual") {
    delete patch.lat;
    delete patch.lng;
    delete patch.locationSource;
  }

  const data = toSlotData(patch);
  await prisma.slot.upsert({
    where: { pageId_key: { pageId, key } },
    update: data,
    create: { ...(data as Prisma.SlotUncheckedCreateInput), pageId, key, type: spec?.type ?? "PHOTO" },
  });
  revalidate(page.book.slug);
}

export async function setTemplateV2(pageIdRaw: string, templateRaw: string) {
  const pageId = id.parse(pageIdRaw);
  const template = templateKey.parse(templateRaw);
  const page = await pageForEdit(pageId);
  const have = new Set(page.slots.map((s) => s.key));
  const missing = slotSpecs(template).filter((s) => !have.has(s.key));
  // slots the new template does not use stay in the database (switching back restores them)
  await prisma.page.update({
    where: { id: pageId },
    data: {
      template,
      layout: TEMPLATES[template].legacy,
      slots: { create: missing.map((s) => ({ key: s.key, type: s.type })) },
    },
  });
  revalidate(page.book.slug);
}

export async function setPageThemeV2(pageIdRaw: string, themeRaw: string | null) {
  const pageId = id.parse(pageIdRaw);
  const theme = themeKey.nullable().parse(themeRaw);
  const page = await pageForEdit(pageId);
  await prisma.page.update({ where: { id: pageId }, data: { theme } });
  revalidate(page.book.slug);
}

export async function setDecorSeedV2(pageIdRaw: string, seedRaw: number) {
  const pageId = id.parse(pageIdRaw);
  const seed = z.number().int().min(0).max(1_000_000).parse(seedRaw);
  const page = await pageForEdit(pageId);
  await prisma.page.update({ where: { id: pageId }, data: { decorSeed: seed } });
  revalidate(page.book.slug);
}

const draftSchema = z.object({
  template: templateKey,
  theme: themeKey.nullable(),
  slots: z.record(z.string().min(1).max(20), slotPatchSchema),
});
export type PageDraft = z.input<typeof draftSchema>;

/** Create stops before the stop at `index` (or at the end); returns them ready to render. */
export async function createPagesV2(bookIdRaw: string, indexRaw: number, draftsRaw: PageDraft[]): Promise<PageV2[]> {
  const bookId = id.parse(bookIdRaw);
  const index = z.number().int().min(0).max(10_000).parse(indexRaw);
  const drafts = z.array(draftSchema).min(1).max(60).parse(draftsRaw);
  await requireEditor(bookId);
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId }, select: { slug: true, theme: true } });

  const ids = await prisma.$transaction(async (tx) => {
    const base = -1_000_000 - Math.floor(Math.random() * 1000) * 100;
    const created: string[] = [];
    for (const [i, d] of drafts.entries()) {
      const rows = slotSpecs(d.template).map((spec) => ({
        key: spec.key,
        type: spec.type,
        ...(toSlotData(d.slots[spec.key] ?? {}) as Omit<Prisma.SlotCreateWithoutPageInput, "key" | "type">),
      }));
      const p = await tx.page.create({
        data: {
          bookId,
          order: base - i,
          layout: TEMPLATES[d.template].legacy,
          template: d.template,
          theme: d.theme,
          slots: { create: rows },
        },
        select: { id: true },
      });
      created.push(p.id);
    }
    await writeOrder(tx, await orderWithInsert(tx, bookId, index, created));
    return created;
  });

  revalidate(book.slug);
  return loadPages(bookId, ids, book.theme);
}

const snapshotSlot = {
  key: true,
  type: true,
  imageUrl: true,
  thumbUrl: true,
  videoUrl: true,
  aspect: true,
  caption: true,
  text: true,
  rotation: true,
  tapeStyle: true,
  dateLabel: true,
  lat: true,
  lng: true,
  locationLabel: true,
  locationSource: true,
  focusX: true,
  focusY: true,
  width: true,
  height: true,
  takenAt: true,
  showDate: true,
} satisfies Prisma.SlotSelect;

export type PageSnapshot = {
  id: string;
  layout: string;
  template: string | null;
  theme: string | null;
  decorSeed: number;
  bgStyle: string | null;
  slots: (Omit<Prisma.SlotGetPayload<{ select: typeof snapshotSlot }>, "takenAt"> & { takenAt: string | null })[];
};

/** Delete a stop; returns everything needed to put it back (undo). */
export async function deletePageV2(pageIdRaw: string): Promise<PageSnapshot> {
  const pageId = id.parse(pageIdRaw);
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: {
      id: true,
      bookId: true,
      layout: true,
      template: true,
      theme: true,
      decorSeed: true,
      bgStyle: true,
      book: { select: { slug: true } },
      slots: { select: snapshotSlot },
    },
  });
  await requireEditor(page.bookId);
  if (page.layout === "COVER" || page.layout === "CLOSING") throw new Error("Book parts are not deleted from the editor");

  await prisma.$transaction(async (tx) => {
    await tx.page.delete({ where: { id: pageId } });
    const rest = await tx.page.findMany({ where: { bookId: page.bookId }, orderBy: { order: "asc" }, select: { id: true } });
    await writeOrder(
      tx,
      rest.map((p) => p.id),
    );
  });
  revalidate(page.book.slug);

  return {
    id: page.id,
    layout: page.layout,
    template: page.template,
    theme: page.theme,
    decorSeed: page.decorSeed,
    bgStyle: page.bgStyle,
    slots: page.slots.map((s) => ({ ...s, takenAt: s.takenAt ? s.takenAt.toISOString() : null })),
  };
}

const snapshotSchema = z.object({
  id,
  layout: z.enum(["SINGLE", "DUO", "TRIO", "PHOTO_TEXT", "DUO_TEXT", "TRIO_TEXT", "VIDEO", "TEXT", "QUOTE"]),
  template: templateKey.nullable(),
  theme: themeKey.nullable(),
  decorSeed: z.number().int().min(0),
  bgStyle: z.string().max(60).nullable(),
  slots: z
    .array(
      z.object({
        key: z.string().min(1).max(20),
        type: z.enum(["PHOTO", "TEXT", "VIDEO"]),
        imageUrl: z.string().regex(MEDIA_PATH_RE).nullable(),
        thumbUrl: z.string().regex(MEDIA_PATH_RE).nullable(),
        videoUrl: z.string().regex(VIDEO_PATH_RE).nullable(),
        aspect: z.string().max(20).nullable(),
        caption: z.string().max(300).nullable(),
        text: z.string().max(5000).nullable(),
        rotation: z.number(),
        tapeStyle: z.string().max(40).nullable(),
        dateLabel: z.string().max(60).nullable(),
        lat: z.number().min(-90).max(90).nullable(),
        lng: z.number().min(-180).max(180).nullable(),
        locationLabel: z.string().max(120).nullable(),
        locationSource: z.string().max(10).nullable(),
        focusX: unit,
        focusY: unit,
        width: z.number().int().nullable(),
        height: z.number().int().nullable(),
        takenAt: z.string().datetime().nullable(),
        showDate: z.boolean(),
      }),
    )
    .max(10),
});

/** Undo of a delete: the same page (same id) back at its old stop position. */
export async function restorePageV2(bookIdRaw: string, snapshotRaw: PageSnapshot, indexRaw: number): Promise<PageV2> {
  const bookId = id.parse(bookIdRaw);
  const snap = snapshotSchema.parse(snapshotRaw);
  const index = z.number().int().min(0).max(10_000).parse(indexRaw);
  await requireEditor(bookId);
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId }, select: { slug: true, theme: true } });

  await prisma.$transaction(async (tx) => {
    await tx.page.create({
      data: {
        id: snap.id,
        bookId,
        order: -2_000_000,
        layout: snap.layout,
        template: snap.template,
        theme: snap.theme,
        decorSeed: snap.decorSeed,
        bgStyle: snap.bgStyle,
        slots: {
          create: snap.slots.map((s) => ({ ...s, takenAt: s.takenAt ? new Date(s.takenAt) : null })),
        },
      },
    });
    await writeOrder(tx, await orderWithInsert(tx, bookId, index, [snap.id]));
  });
  revalidate(book.slug);
  return (await loadPages(bookId, [snap.id], book.theme))[0];
}

/** New stop order (stop ids only; book parts stay at the ends). */
export async function reorderStopsV2(bookIdRaw: string, idsRaw: string[]) {
  const bookId = id.parse(bookIdRaw);
  const ids = z.array(id).max(2000).parse(idsRaw);
  await requireEditor(bookId);
  const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId }, select: { slug: true } });

  await prisma.$transaction(async (tx) => {
    const all = await tx.page.findMany({ where: { bookId }, orderBy: { order: "asc" }, select: { id: true, layout: true } });
    const stops = all.filter((p) => p.layout !== "COVER" && p.layout !== "CLOSING");
    const have = new Set(stops.map((p) => p.id));
    if (ids.length !== have.size || ids.some((x) => !have.has(x))) throw new Error("Page list out of sync; reload and try again");
    const covers = all.filter((p) => p.layout === "COVER").map((p) => p.id);
    const closings = all.filter((p) => p.layout === "CLOSING").map((p) => p.id);
    await writeOrder(tx, [...covers, ...ids, ...closings]);
  });
  revalidate(book.slug);
}

const bookPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    subtitle: text(200),
    volume: z.number().int().min(1).max(999).nullable(),
    theme: themeKey,
    coverImageUrl: z.string().regex(MEDIA_PATH_RE).nullable(),
    coverFocusX: unit,
    coverFocusY: unit,
    coverText: text(120),
    closingText: text(200),
  })
  .partial()
  .strict();
export type BookPatchInput = z.input<typeof bookPatchSchema>;

export async function updateBookV2(bookIdRaw: string, patchRaw: BookPatchInput) {
  const bookId = id.parse(bookIdRaw);
  const patch = bookPatchSchema.parse(patchRaw);
  await requireEditor(bookId);
  const book = await prisma.book.update({ where: { id: bookId }, data: patch, select: { slug: true } });
  revalidate(book.slug);
}

/** For the reload button: the book's stops as the server sees them. */
export async function reloadPagesV2(bookIdRaw: string): Promise<PageV2[]> {
  const bookId = id.parse(bookIdRaw);
  await requireEditor(bookId);
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { theme: true, pages: { orderBy: { order: "asc" }, select: pageSelect } },
  });
  const theme = toThemeKey(book.theme);
  return book.pages.map((p) => toPageV2(p, theme)).filter((p): p is PageV2 => p !== null);
}
