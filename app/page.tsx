import { redirect } from "next/navigation";
import { Shelf } from "@/components/shelf/Shelf";
import { getEditorShelfId } from "@/lib/auth";
import { isV2, v2Suffix } from "@/lib/v2/flag";
import { loadShelf } from "@/lib/v2/shelf";

type Props = { searchParams: Promise<{ v?: string }> };

// v2: the shelf of books. v1 hosts a single book: the landing page just
// forwards to it.
export default async function Home({ searchParams }: Props) {
  const sp = await searchParams;
  if (isV2(sp.v)) {
    const shelf = await loadShelf();
    if (shelf && shelf.books.length > 0) {
      const canEdit = (await getEditorShelfId()) === shelf.id;
      return <Shelf shelf={shelf} canEdit={canEdit} hrefSuffix={v2Suffix(sp.v)} />;
    }
  }
  redirect(`/book/${process.env.DEFAULT_SLUG ?? "our-story"}${v2Suffix(sp.v)}`);
}
