import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { World } from "@/components/world/World";
import { prisma } from "@/lib/db";
import { loadBookV2 } from "@/lib/v2/book";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; p?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true, subtitle: true, coverImageUrl: true },
  });
  if (!book) return {};
  return {
    title: book.title,
    description: book.subtitle ?? undefined,
    openGraph: {
      title: book.title,
      description: book.subtitle ?? undefined,
      images: book.coverImageUrl ? [book.coverImageUrl] : undefined,
    },
  };
}

// One book as one continuous world. `?p=<pageId>` (and the older
// `?page=<order>`) start at that stop and skip the cover.
export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const book = await loadBookV2(slug);
  if (!book) notFound();
  const order = Number.parseInt(sp.page ?? "", 10);
  return <World book={book} initialPageId={sp.p ?? null} initialOrder={Number.isFinite(order) ? order : null} />;
}
