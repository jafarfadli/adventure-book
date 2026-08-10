import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { getEditorBookId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Mode edit — Adventure Book" };

type Props = { params: Promise<{ slug: string }> };

export default async function EditPage({ params }: Props) {
  const { slug } = await params;

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
              caption: true,
              text: true,
              rotation: true,
              tapeStyle: true,
              dateLabel: true,
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
