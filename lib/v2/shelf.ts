import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toThemeKey, type ThemeKey } from "./themes";

/** A shelf's wishes. */
export function shelfWishes(shelfId: string): Prisma.WishlistItemWhereInput {
  return { shelfId };
}

export type ShelfBook = {
  id: string;
  slug: string;
  title: string;
  theme: ThemeKey;
  coverImageUrl: string | null;
  coverFocusX: number;
  coverFocusY: number;
  coverText: string | null;
  closingText: string | null;
  stops: number;
};

export type ShelfV2 = { id: string; title: string; theme: ThemeKey; books: ShelfBook[] };

/** The couple's shelf with its books in shelf order, or null when there is none yet. */
export async function loadShelf(): Promise<ShelfV2 | null> {
  const shelf = await prisma.shelf.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      books: {
        orderBy: [{ shelfOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          theme: true,
          coverImageUrl: true,
          coverFocusX: true,
          coverFocusY: true,
          coverText: true,
          closingText: true,
          _count: { select: { pages: true } },
        },
      },
    },
  });
  if (!shelf) return null;
  const books = shelf.books.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    theme: toThemeKey(b.theme),
    coverImageUrl: b.coverImageUrl,
    coverFocusX: b.coverFocusX,
    coverFocusY: b.coverFocusY,
    coverText: b.coverText,
    closingText: b.closingText,
    stops: b._count.pages,
  }));
  return { id: shelf.id, title: shelf.title, theme: books[0]?.theme ?? "stroberi", books };
}
