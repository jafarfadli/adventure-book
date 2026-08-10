import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapShell } from "@/components/map/MapShell";
import type { MapMarkerData } from "@/components/map/MapView";
import { prisma } from "@/lib/db";
import { getTheme } from "@/lib/themes";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    select: { title: true },
  });
  if (!book) return {};
  return { title: `Peta kenangan — ${book.title}` };
}

export default async function MapPage({ params }: Props) {
  const { slug } = await params;

  const book = await prisma.book.findUnique({
    where: { slug },
    select: { id: true, title: true, theme: true },
  });
  if (!book) notFound();

  // Photos without coordinates are excluded here — no marker is ever
  // created for them (§7.5).
  const slots = await prisma.slot.findMany({
    where: {
      type: "PHOTO",
      lat: { not: null },
      lng: { not: null },
      page: { bookId: book.id },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      thumbUrl: true,
      caption: true,
      locationLabel: true,
      page: { select: { order: true } },
    },
    orderBy: { page: { order: "asc" } },
  });

  const markers: MapMarkerData[] = slots.map((s) => ({
    id: s.id,
    lat: s.lat as number,
    lng: s.lng as number,
    thumbUrl: s.thumbUrl,
    caption: s.caption,
    locationLabel: s.locationLabel,
    pageOrder: s.page.order,
  }));

  if (markers.length === 0) {
    const theme = getTheme(book.theme);
    return (
      <main
        className={`flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-6 ${theme.backdrop}`}
      >
        <p className={`font-hand text-3xl ${theme.ink}`}>
          Belum ada foto dengan lokasi 📍
        </p>
        <p className={`max-w-sm text-center text-sm ${theme.inkSoft}`}>
          Tambahkan lokasi lewat mode edit — otomatis dari foto ber-geotag, atau
          set manual dengan menaruh pin.
        </p>
        <Link
          href={`/book/${slug}`}
          className="rounded-full bg-white/70 px-4 py-2 text-sm text-stone-700 shadow-sm transition hover:bg-white"
        >
          ← Kembali ke buku
        </Link>
      </main>
    );
  }

  return <MapShell markers={markers} slug={slug} title={book.title} />;
}
