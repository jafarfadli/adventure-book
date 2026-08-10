"use server";

import { Layout } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LAYOUTS } from "@/lib/layouts";

const cuidSchema = z.string().min(1).max(64);
const layoutSchema = z.nativeEnum(Layout);

function revalidateBook(slug: string) {
  revalidatePath(`/book/${slug}`);
  revalidatePath(`/book/${slug}/edit`);
}

export async function createPage(bookIdRaw: string, layoutRaw: string) {
  const bookId = cuidSchema.parse(bookIdRaw);
  const layout = layoutSchema.parse(layoutRaw);
  await requireEditor(bookId);

  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { slug: true, _count: { select: { pages: true } } },
  });

  await prisma.page.create({
    data: {
      bookId,
      order: book._count.pages,
      layout,
      slots: {
        create: LAYOUTS[layout].slots.map((spec) => ({
          key: spec.key,
          type: spec.type,
        })),
      },
    },
  });

  revalidateBook(book.slug);
}

export async function deletePage(pageIdRaw: string) {
  const pageId = cuidSchema.parse(pageIdRaw);

  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    select: { bookId: true, book: { select: { slug: true } } },
  });
  await requireEditor(page.bookId);

  await prisma.$transaction(async (tx) => {
    await tx.page.delete({ where: { id: pageId } });
    // Keep Page.order contiguous after the removal.
    const remaining = await tx.page.findMany({
      where: { bookId: page.bookId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    // Two passes so the [bookId, order] unique constraint never collides.
    for (const [i, p] of remaining.entries()) {
      await tx.page.update({ where: { id: p.id }, data: { order: -(i + 1) } });
    }
    for (const [i, p] of remaining.entries()) {
      await tx.page.update({ where: { id: p.id }, data: { order: i } });
    }
  });

  revalidateBook(page.book.slug);
}

export async function reorderPages(bookIdRaw: string, orderedIdsRaw: string[]) {
  const bookId = cuidSchema.parse(bookIdRaw);
  const orderedIds = z.array(cuidSchema).max(500).parse(orderedIdsRaw);
  await requireEditor(bookId);

  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { slug: true, pages: { select: { id: true } } },
  });

  const existing = new Set(book.pages.map((p) => p.id));
  const incoming = new Set(orderedIds);
  if (
    existing.size !== incoming.size ||
    [...existing].some((id) => !incoming.has(id))
  ) {
    throw new Error("Page list out of sync; refresh and try again");
  }

  await prisma.$transaction(async (tx) => {
    for (const [i, id] of orderedIds.entries()) {
      await tx.page.update({ where: { id }, data: { order: -(i + 1) } });
    }
    for (const [i, id] of orderedIds.entries()) {
      await tx.page.update({ where: { id }, data: { order: i } });
    }
  });

  revalidateBook(book.slug);
}
