import { prisma } from "@/lib/db";
import { toThemeKey, type ThemeKey } from "./themes";

export type ShelfBook = {
  id: string;
  slug: string;
  title: string;
  volume: number;
  theme: ThemeKey;
  coverImageUrl: string | null;
  coverFocusX: number;
  coverFocusY: number;
  coverText: string | null;
  stops: number;
};

export type ShelfV2 = { id: string; title: string; theme: ThemeKey; books: ShelfBook[] };

/** The couple's shelf with its books in shelf order, or null before the shelf backfill. */
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
          volume: true,
          theme: true,
          coverImageUrl: true,
          coverFocusX: true,
          coverFocusY: true,
          coverText: true,
          _count: { select: { pages: { where: { layout: { notIn: ["COVER", "CLOSING"] } } } } },
        },
      },
    },
  });
  if (!shelf) return null;
  const books = shelf.books.map((b, i) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    volume: b.volume ?? i + 1,
    theme: toThemeKey(b.theme),
    coverImageUrl: b.coverImageUrl,
    coverFocusX: b.coverFocusX,
    coverFocusY: b.coverFocusY,
    coverText: b.coverText,
    stops: b._count.pages,
  }));
  return { id: shelf.id, title: shelf.title, theme: books[0]?.theme ?? "stroberi", books };
}
