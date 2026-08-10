"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { prisma } from "@/lib/db";

const idSchema = z.string().min(1).max(64);
const textSchema = z.string().trim().min(1, "Tulis dulu, ya").max(200);

function revalidateWishlist(slug: string) {
  revalidatePath(`/book/${slug}/wishlist`);
}

export async function addWishlistItem(bookIdRaw: string, textRaw: string) {
  const bookId = idSchema.parse(bookIdRaw);
  const text = textSchema.parse(textRaw);
  await requireEditor(bookId);

  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { slug: true, _count: { select: { wishlist: true } } },
  });

  await prisma.wishlistItem.create({
    data: { bookId, text, order: book._count.wishlist },
  });

  revalidateWishlist(book.slug);
}

export async function toggleWishlistItem(itemIdRaw: string) {
  const itemId = idSchema.parse(itemIdRaw);

  const item = await prisma.wishlistItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { bookId: true, done: true, book: { select: { slug: true } } },
  });
  await requireEditor(item.bookId);

  const done = !item.done;
  await prisma.wishlistItem.update({
    where: { id: itemId },
    // doneAt only means anything while the item is done.
    data: { done, doneAt: done ? new Date() : null },
  });

  revalidateWishlist(item.book.slug);
}

export async function deleteWishlistItem(itemIdRaw: string) {
  const itemId = idSchema.parse(itemIdRaw);

  const item = await prisma.wishlistItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { bookId: true, book: { select: { slug: true } } },
  });
  await requireEditor(item.bookId);

  await prisma.wishlistItem.delete({ where: { id: itemId } });

  revalidateWishlist(item.book.slug);
}
