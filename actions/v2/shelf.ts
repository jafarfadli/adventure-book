"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getEditorShelfId, requireShelfEditor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shelfWishes } from "@/lib/v2/shelf";
import { slugify, uniqueSlug } from "@/lib/v2/slug";
import { THEME_KEYS } from "@/lib/v2/themes";

// Shelf-level mutations: a new book (next volume), and the shared wishlist.
// The shelf comes from the session itself; requireShelfEditor runs before
// anything is written.

async function sessionShelf(): Promise<string> {
  const shelfId = await getEditorShelfId();
  if (!shelfId) throw new Error("Unauthorized: shelf editor session required");
  await requireShelfEditor(shelfId);
  return shelfId;
}

export async function createBookV2(titleRaw: string, themeRaw: string): Promise<{ slug: string }> {
  const title = z.string().trim().min(1).max(120).parse(titleRaw);
  const theme = z.enum(THEME_KEYS).parse(themeRaw);
  const shelfId = await sessionShelf();
  const shelf = await prisma.shelf.findUniqueOrThrow({
    where: { id: shelfId },
    select: { editPasswordHash: true, books: { select: { volume: true, shelfOrder: true } } },
  });
  const taken = new Set((await prisma.book.findMany({ select: { slug: true } })).map((b) => b.slug));
  const slug = uniqueSlug(slugify(title), taken);
  const volume = Math.max(0, ...shelf.books.map((b) => b.volume ?? 0)) + 1;
  const shelfOrder = Math.max(-1, ...shelf.books.map((b) => b.shelfOrder)) + 1;
  await prisma.book.create({
    data: { slug, title, theme, volume, shelfId, shelfOrder, editPasswordHash: shelf.editPasswordHash },
  });
  revalidatePath("/");
  return { slug };
}

const wishText = z.string().trim().min(1).max(200);
const wishId = z.string().min(1).max(64);

function revalidateWishlist() {
  revalidatePath("/wishlist");
  revalidatePath("/", "layout");
}

export async function addWishV2(textRaw: string): Promise<{ id: string; text: string; done: boolean; doneAt: string | null }> {
  const text = wishText.parse(textRaw);
  const shelfId = await sessionShelf();
  // v1 still files wishes under a book: use the shelf's first one
  const first = await prisma.book.findFirstOrThrow({ where: { shelfId }, orderBy: { shelfOrder: "asc" }, select: { id: true } });
  // appended after the last one (a count would collide once something is deleted)
  const { _max } = await prisma.wishlistItem.aggregate({ where: shelfWishes(shelfId), _max: { order: true } });
  const item = await prisma.wishlistItem.create({ data: { shelfId, bookId: first.id, text, order: (_max.order ?? -1) + 1 } });
  revalidateWishlist();
  return { id: item.id, text: item.text, done: false, doneAt: null };
}

async function ownWish(idRaw: string) {
  const id = wishId.parse(idRaw);
  const shelfId = await sessionShelf();
  const item = await prisma.wishlistItem.findUniqueOrThrow({
    where: { id },
    select: { id: true, shelfId: true, done: true, book: { select: { shelfId: true } } },
  });
  if (item.shelfId !== shelfId && item.book.shelfId !== shelfId) throw new Error("Unauthorized: not on this shelf");
  return item;
}

export async function setWishDoneV2(idRaw: string, done: boolean): Promise<void> {
  const item = await ownWish(idRaw);
  await prisma.wishlistItem.update({ where: { id: item.id }, data: { done: z.boolean().parse(done), doneAt: done ? new Date() : null } });
  revalidateWishlist();
}

export async function deleteWishV2(idRaw: string): Promise<{ text: string; order: number }> {
  const item = await ownWish(idRaw);
  const row = await prisma.wishlistItem.delete({ where: { id: item.id }, select: { text: true, order: true } });
  revalidateWishlist();
  return row;
}

/** Only a book without a single stop can be removed (a mistaken "new book"). */
export async function deleteEmptyBookV2(bookIdRaw: string): Promise<void> {
  const bookId = z.string().min(1).max(64).parse(bookIdRaw);
  const shelfId = await sessionShelf();
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: { shelfId: true, _count: { select: { pages: true } } },
  });
  if (book.shelfId !== shelfId) throw new Error("Unauthorized: not on this shelf");
  if (book._count.pages > 0) throw new Error("Only an empty book can be deleted");
  await prisma.book.delete({ where: { id: bookId } });
  revalidatePath("/");
}
