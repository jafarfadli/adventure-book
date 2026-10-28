import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CuteBackdrop } from "@/components/reader/CuteBackdrop";
import { WishlistView, type WishItem } from "@/components/wishlist/WishlistView";
import { prisma } from "@/lib/db";
import { isV2, v2Suffix } from "@/lib/v2/flag";
import { getTheme } from "@/lib/themes";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true },
  });
  if (!book) return {};
  return { title: `Wishlist — ${book.title}` };
}

export default async function WishlistPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  // v2: one map / wishlist for the whole shelf
  if (isV2(sp.v)) redirect(`/wishlist${v2Suffix(sp.v)}`);

  const book = await prisma.book.findUnique({
    where: { slug },
    select: {
      id: true,
      theme: true,
      wishlist: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, done: true, doneAt: true },
      },
    },
  });
  if (!book) notFound();

  // Read-only view; editing lives on its own route, like the book.
  const theme = getTheme(book.theme);

  const items: WishItem[] = book.wishlist.map((i) => ({
    id: i.id,
    text: i.text,
    done: i.done,
    doneAt: i.doneAt ? dateFmt.format(i.doneAt) : null,
  }));

  return (
    <main
      className={`relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4 py-12 ${theme.backdrop}`}
    >
      <CuteBackdrop />
      <div className="relative w-full">
        <WishlistView
          bookId={book.id}
          slug={slug}
          items={items}
          canEdit={false}
          theme={theme}
        />
      </div>
    </main>
  );
}
