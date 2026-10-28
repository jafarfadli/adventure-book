import type { Metadata } from "next";
import { Wishlist, type Wish } from "@/components/wishlist-v2/Wishlist";
import { getEditorShelfId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { v2Suffix } from "@/lib/v2/flag";
import { loadShelf } from "@/lib/v2/shelf";

export const metadata: Metadata = { title: "Wishlist" };

type Props = { searchParams: Promise<{ v?: string }> };

export default async function WishlistRoute({ searchParams }: Props) {
  const sp = await searchParams;
  const shelf = await loadShelf();
  const rows = await prisma.wishlistItem.findMany({
    where: shelf ? { shelfId: shelf.id } : {},
    orderBy: { order: "asc" },
    select: { id: true, text: true, done: true, doneAt: true },
  });
  const items: Wish[] = rows.map((r) => ({ ...r, doneAt: r.doneAt ? r.doneAt.toISOString() : null }));
  const canEdit = Boolean(shelf) && (await getEditorShelfId()) === shelf!.id;
  return <Wishlist items={items} canEdit={canEdit} theme={shelf?.theme ?? "stroberi"} backHref={`/${v2Suffix(sp.v)}`} />;
}
