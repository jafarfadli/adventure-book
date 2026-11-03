import type { Metadata } from "next";
import { MapPage } from "@/components/map-v2/MapPage";
import type { MapPin } from "@/components/map-v2/MapView";
import { prisma } from "@/lib/db";
import { pageSelect, toPageV2 } from "@/lib/v2/load";
import { loadShelf } from "@/lib/v2/shelf";
import { hasMedia, visibleSlots } from "@/lib/v2/visible";

export const metadata: Metadata = { title: "Peta kenangan" };

// Every geotagged photo and video shown in any book on the shelf. Media
// without coordinates simply has no pin.
export default async function MapRoute() {
  const shelf = await loadShelf();
  const books = shelf?.books ?? [];
  const bookIndex = new Map(books.map((b, i) => [b.id, i]));

  const pages = await prisma.page.findMany({
    where: shelf ? { book: { shelfId: shelf.id } } : {},
    select: { ...pageSelect, book: { select: { id: true, slug: true, theme: true } } },
  });

  // only what a reader can see: a slot the page's template shows, with its media
  const pins: MapPin[] = [];
  for (const row of pages) {
    const page = toPageV2(row, row.book.theme);
    if (!page) continue;
    for (const s of visibleSlots(page)) {
      if (!hasMedia(s) || s.lat === null || s.lng === null) continue;
      pins.push({
        id: `${page.id}-${s.key}`,
        lat: s.lat,
        lng: s.lng,
        thumbUrl: s.thumbUrl,
        caption: s.caption,
        locationLabel: s.locationLabel,
        href: `/book/${row.book.slug}?p=${page.id}`,
        book: bookIndex.get(row.book.id) ?? 0,
      });
    }
  }

  return <MapPage pins={pins} books={books.map((b) => ({ title: b.title, theme: b.theme }))} backHref="/" />;
}
