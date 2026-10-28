import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { EditorWorld } from "@/components/editor-v2/EditorWorld";
import { canEditBook, getEditorBookId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadBookV2 } from "@/lib/v2/book";
import { isV2, v2Suffix } from "@/lib/v2/flag";

export const metadata: Metadata = { title: "Mode edit — Adventure Book" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export default async function EditPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  if (isV2(sp.v)) {
    const book = await loadBookV2(slug);
    if (!book) notFound();
    const suffix = v2Suffix(sp.v);
    if (!(await canEditBook(book.id))) redirect(`/book/${slug}/unlock${suffix}`);
    return <EditorWorld initial={book} readerHref={`/book/${slug}${suffix}`} />;
  }

  const book = await prisma.book.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      theme: true,
      coverImageUrl: true,
      pages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          layout: true,
          bgStyle: true,
          slots: {
            select: {
              key: true,
              type: true,
              imageUrl: true,
              thumbUrl: true,
              videoUrl: true,
              aspect: true,
              caption: true,
              text: true,
              rotation: true,
              tapeStyle: true,
              dateLabel: true,
              lat: true,
              lng: true,
              locationLabel: true,
              locationSource: true,
            },
          },
        },
      },
    },
  });
  if (!book) notFound();

  const sessionBookId = await getEditorBookId();
  if (sessionBookId !== book.id) redirect(`/book/${slug}/unlock`);

  return <EditorShell book={book} />;
}
