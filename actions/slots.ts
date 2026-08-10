"use server";

import { Layout } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LAYOUTS } from "@/lib/layouts";
import { isTapeStyle } from "@/lib/tapes";

const cuidSchema = z.string().min(1).max(64);
const mediaPathSchema = z
  .string()
  .regex(/^\/api\/media\/[A-Za-z0-9-]+(\.thumb)?\.webp$/, "Path media tidak valid");

const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());

const slotDataSchema = z.object({
  caption: z.string().max(300).transform(emptyToNull).nullish(),
  text: z.string().max(5000).transform(emptyToNull).nullish(),
  imageUrl: mediaPathSchema.nullish(),
  thumbUrl: mediaPathSchema.nullish(),
  rotation: z.number().min(-10).max(10).nullish(),
  tapeStyle: z.string().refine(isTapeStyle, "Gaya selotip tidak dikenal").nullish(),
  dateLabel: z.string().max(60).transform(emptyToNull).nullish(),
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
