import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookReader from "@/components/reader/BookReader";
import { prisma } from "@/lib/db";
import type { BookData } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

async function fetchBook(slug: string): Promise<BookData | null> {
  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      pages: {
        orderBy: { order: "asc" },
        include: { slots: true },
      },
    },
  });
  if (!book) return null;

  return {
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    theme: book.theme,
    coverImageUrl: book.coverImageUrl,
    pages: book.pages.map((page) => ({
      id: page.id,
      order: page.order,
      layout: page.layout,
      bgStyle: page.bgStyle,
      slots: page.slots.map((slot) => ({
        key: slot.key,
        type: slot.type,
        imageUrl: slot.imageUrl,
        thumbUrl: slot.thumbUrl,
        caption: slot.caption,
        text: slot.text,
        rotation: slot.rotation,
        tapeStyle: slot.tapeStyle,
        dateLabel: slot.dateLabel,
      })),
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true, subtitle: true },
  });
  if (!book) return {};
  return {
    title: book.title,
    description: book.subtitle ?? undefined,
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await fetchBook(slug);
  if (!book) notFound();
  return <BookReader book={book} />;
}
