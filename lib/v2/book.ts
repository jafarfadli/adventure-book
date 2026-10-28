import { prisma } from "@/lib/db";
import { pageSelect, toPageV2 } from "./load";
import { shelfWishes } from "./shelf";
import { toThemeKey } from "./themes";
import type { BookV2, PageV2 } from "./types";
import { bookStats } from "./visible";

/** Everything the v2 reader/editor needs for one book, or null if the slug is unknown. */
export async function loadBookV2(slug: string): Promise<BookV2 | null> {
  const book = await prisma.book.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      volume: true,
      theme: true,
      shelfId: true,
      coverImageUrl: true,
      coverFocusX: true,
      coverFocusY: true,
      coverText: true,
      closingText: true,
      pages: { orderBy: { order: "asc" }, select: pageSelect },
    },
  });
  if (!book) return null;

  const theme = toThemeKey(book.theme);
  const pages = book.pages.map((p) => toPageV2(p, theme)).filter((p): p is PageV2 => p !== null);

  // v1 wishlists hang off the book; v2 moves them to the shelf (phase 5).
  const wishlist = await prisma.wishlistItem.findMany({
    where: { done: false, ...(book.shelfId ? shelfWishes(book.shelfId) : { bookId: book.id }) },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: 3,
    select: { id: true, text: true },
  });

  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    volume: book.volume ?? 1,
    theme,
    coverImageUrl: book.coverImageUrl,
    coverFocusX: book.coverFocusX,
    coverFocusY: book.coverFocusY,
    coverText: book.coverText,
    closingText: book.closingText,
    pages,
    stats: bookStats(pages),
    wishlistTop: wishlist,
  };
}
