import { prisma } from "@/lib/db";
import { slotDate } from "./dates";
import { pageSelect, toPageV2 } from "./load";
import { toThemeKey } from "./themes";
import type { BookV2, PageV2 } from "./types";

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

  const slots = pages.flatMap((p) => Object.values(p.slots));
  const media = slots.filter((s) => s.imageUrl || s.videoUrl).length;
  const dates = slots
    .map((s) => slotDate(s))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  // v1 wishlists hang off the book; v2 moves them to the shelf (phase 5).
  const wishlist = await prisma.wishlistItem.findMany({
    where: { done: false, OR: [{ bookId: book.id }, ...(book.shelfId ? [{ shelfId: book.shelfId }] : [])] },
    orderBy: { order: "asc" },
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
    stats: {
      stops: pages.length,
      media,
      first: dates[0]?.toISOString() ?? null,
      last: dates[dates.length - 1]?.toISOString() ?? null,
    },
    wishlistTop: wishlist,
  };
}
