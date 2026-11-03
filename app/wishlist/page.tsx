import type { Metadata } from "next";
import { Wishlist, type Wish } from "@/components/wishlist-v2/Wishlist";
import { getEditorShelfId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadShelf, shelfWishes } from "@/lib/v2/shelf";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistRoute() {
  const shelf = await loadShelf();
  const rows = await prisma.wishlistItem.findMany({
    // no shelf yet: nothing to list
    where: shelf ? shelfWishes(shelf.id) : { id: { in: [] } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, text: true, done: true, doneAt: true },
  });
  const items: Wish[] = rows.map((r) => ({ ...r, doneAt: r.doneAt ? r.doneAt.toISOString() : null }));
  const canEdit = Boolean(shelf) && (await getEditorShelfId()) === shelf!.id;
  return <Wishlist items={items} canEdit={canEdit} theme={shelf?.theme ?? "stroberi"} backHref="/" />;
}
