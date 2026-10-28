import type { Metadata } from "next";
import { MapPage } from "@/components/map-v2/MapPage";
import type { MapPin } from "@/components/map-v2/MapView";
import { prisma } from "@/lib/db";
import { v2Suffix } from "@/lib/v2/flag";
import { loadShelf } from "@/lib/v2/shelf";

export const metadata: Metadata = { title: "Peta kenangan" };

type Props = { searchParams: Promise<{ v?: string }> };

// Every geotagged photo and video of every book on the shelf. Media without
// coordinates simply has no pin.
export default async function MapRoute({ searchParams }: Props) {
  const sp = await searchParams;
  const suffix = v2Suffix(sp.v);
  const shelf = await loadShelf();
  const books = shelf?.books ?? [];
  const bookIndex = new Map(books.map((b, i) => [b.id, i]));

  const slots = await prisma.slot.findMany({
    where: {
      type: { in: ["PHOTO", "VIDEO"] },
      lat: { not: null },
      lng: { not: null },
      page: { layout: { notIn: ["COVER", "CLOSING"] }, ...(shelf ? { book: { shelfId: shelf.id } } : {}) },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      thumbUrl: true,
      caption: true,
      locationLabel: true,
      page: { select: { id: true, book: { select: { id: true, slug: true } } } },
    },
  });

  const sep = suffix ? "&" : "?";
  const pins: MapPin[] = slots.map((s) => ({
    id: s.id,
    lat: s.lat as number,
    lng: s.lng as number,
    thumbUrl: s.thumbUrl,
    caption: s.caption,
    locationLabel: s.locationLabel,
    href: `/book/${s.page.book.slug}${suffix}${sep}p=${s.page.id}`,
    book: bookIndex.get(s.page.book.id) ?? 0,
  }));

  return <MapPage pins={pins} books={books.map((b) => ({ title: b.title, theme: b.theme }))} backHref={`/${suffix}`} />;
}
