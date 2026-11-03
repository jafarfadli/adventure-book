import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditorWorld } from "@/components/editor-v2/EditorWorld";
import { canEditBook } from "@/lib/auth";
import { loadBookV2 } from "@/lib/v2/book";

export const metadata: Metadata = { title: "Mode edit — Adventure Book" };

type Props = { params: Promise<{ slug: string }> };

export default async function EditPage({ params }: Props) {
  const { slug } = await params;
  const book = await loadBookV2(slug);
  if (!book) notFound();
  if (!(await canEditBook(book.id))) redirect(`/book/${slug}/unlock`);
  return <EditorWorld initial={book} readerHref={`/book/${slug}`} shelfHref="/" />;
}
