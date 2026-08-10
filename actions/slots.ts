"use server";

import { Layout } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { MEDIA_PATH_RE } from "@/lib/basePath";
import { prisma } from "@/lib/db";
import { LAYOUTS } from "@/lib/layouts";
import { isTapeStyle } from "@/lib/tapes";

const cuidSchema = z.string().min(1).max(64);
const mediaPathSchema = z
  .string()
  .regex(MEDIA_PATH_RE, "Path media tidak valid");

const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());

const slotDataSchema = z
  .object({
    caption: z.string().max(300).transform(emptyToNull).nullish(),
    text: z.string().max(5000).transform(emptyToNull).nullish(),
    imageUrl: mediaPathSchema.nullish(),
    thumbUrl: mediaPathSchema.nullish(),
    rotation: z.number().min(-10).max(10).nullish(),
    tapeStyle: z.string().refine(isTapeStyle, "Gaya selotip tidak dikenal").nullish(),
    dateLabel: z.string().max(60).transform(emptyToNull).nullish(),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
    locationLabel: z.string().max(120).transform(emptyToNull).nullish(),
    locationSource: z.enum(["exif", "manual"]).nullish(),
  })
  .refine((d) => (d.lat == null) === (d.lng == null), {
    message: "lat dan lng harus diisi berpasangan",
  });

export type SlotInput = z.input<typeof slotDataSchema>;

function revalidateBook(slug: string) {
  revalidatePath(`/book/${slug}`);
  revalidatePath(`/book/${slug}/edit`);
}

export async function upsertSlot(pageIdRaw: string, keyRaw: string, dataRaw: SlotInput) {
  const pageId = cuidSchema.parse(pageIdRaw);
  const key = z.string().min(1).max(40).parse(keyRaw);
  const data = slotDataSchema.parse(dataRaw);

  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: { bookId: true, layout: true, book: { select: { slug: true } } },
  });
  await requireEditor(page.bookId);

  const spec = LAYOUTS[page.layout].slots.find((s) => s.key === key);
  if (!spec) throw new Error(`Slot "${key}" is not part of layout ${page.layout}`);

  // Location precedence (§7.5): a manual pin is never silently replaced by
  // EXIF data from a re-upload — only an explicit manual set or clear wins.
  const existing = await prisma.slot.findUnique({
    where: { pageId_key: { pageId, key } },
    select: { lat: true, lng: true, locationLabel: true, locationSource: true },
  });
  const hasCoords = data.lat != null && data.lng != null;
  let location = {
    lat: hasCoords ? (data.lat as number) : null,
    lng: hasCoords ? (data.lng as number) : null,
    locationLabel: hasCoords ? (data.locationLabel ?? null) : null,
    locationSource: hasCoords ? (data.locationSource ?? "manual") : null,
  };
  if (existing?.locationSource === "manual" && location.locationSource === "exif") {
    location = {
      lat: existing.lat,
      lng: existing.lng,
      locationLabel: existing.locationLabel,
      locationSource: existing.locationSource,
    };
  }

  // Only persist the fields that make sense for the slot's type.
  const fields =
    spec.type === "PHOTO"
      ? {
          caption: data.caption ?? null,
          imageUrl: data.imageUrl ?? null,
          thumbUrl: data.thumbUrl ?? null,
          rotation: data.rotation ?? 0,
          tapeStyle: data.tapeStyle ?? null,
          dateLabel: data.dateLabel ?? null,
          ...location,
        }
      : {
          text: data.text ?? null,
          rotation: data.rotation ?? 0,
        };

  await prisma.slot.upsert({
    where: { pageId_key: { pageId, key } },
    update: fields,
    create: { pageId, key, type: spec.type, ...fields },
  });

  revalidateBook(page.book.slug);
}

/**
 * Guardrail (§3): keep slot rows whose key exists in the new layout, drop the
 * rest. The client shows a confirm dialog before calling when data would drop.
 */
export async function setPageLayout(pageIdRaw: string, layoutRaw: string) {
  const pageId = cuidSchema.parse(pageIdRaw);
  const layout = z.nativeEnum(Layout).parse(layoutRaw);

  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: {
      bookId: true,
      book: { select: { slug: true } },
      slots: { select: { key: true, type: true } },
    },
  });
  await requireEditor(page.bookId);

  const specs = LAYOUTS[layout].slots;
  const keepKeys = new Set(
    specs
      .filter((s) => page.slots.some((row) => row.key === s.key && row.type === s.type))
      .map((s) => s.key),
  );
  const missing = specs.filter((s) => !keepKeys.has(s.key));

  await prisma.$transaction([
    prisma.slot.deleteMany({
      where: { pageId, key: { notIn: [...keepKeys] } },
    }),
    prisma.page.update({
      where: { id: pageId },
      data: {
        layout,
        slots: {
          create: missing.map((s) => ({ key: s.key, type: s.type })),
        },
      },
    }),
  ]);

  revalidateBook(page.book.slug);
}
