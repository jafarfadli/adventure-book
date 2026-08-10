import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookReader from "@/components/reader/BookReader";
import { prisma } from "@/lib/db";
import type { BookData } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

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
        lat: slot.lat,
        lng: slot.lng,
        locationLabel: slot.locationLabel,
        locationSource: slot.locationSource,
      })),
    })),
  };
}

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

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const book = await fetchBook(slug);
  if (!book) notFound();

  // ?page= deep link (used by the memory map's click-to-page)
  const { page } = await searchParams;
  const parsed = Number.parseInt(page ?? "", 10);
  const initialPage = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 0), Math.max(book.pages.length - 1, 0))
    : 0;

  return <BookReader book={book} initialPage={initialPage} />;
}
