import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shelf } from "@/components/shelf/Shelf";
import { getEditorShelfId } from "@/lib/auth";
import { loadShelf } from "@/lib/v2/shelf";

export async function generateMetadata(): Promise<Metadata> {
  const shelf = await loadShelf();
  return shelf ? { title: shelf.title } : {};
}

// The shelf of books. Without a shelf (an empty database) go straight to the
// default book.
export default async function Home() {
  const shelf = await loadShelf();
  if (shelf && shelf.books.length > 0) {
    const canEdit = (await getEditorShelfId()) === shelf.id;
    return <Shelf shelf={shelf} canEdit={canEdit} />;
  }
  redirect(`/book/${process.env.DEFAULT_SLUG ?? "our-story"}`);
}
