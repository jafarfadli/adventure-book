import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UnlockV2 } from "@/components/editor-v2/UnlockV2";
import { canEditBook } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toThemeKey } from "@/lib/v2/themes";

export const metadata: Metadata = { title: "Buka mode edit — Adventure Book" };

type Props = { params: Promise<{ slug: string }> };

export default async function UnlockPage({ params }: Props) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({ where: { slug }, select: { id: true, theme: true } });
  // never reveal whether a slug exists: an unknown book just shows the form
  if (book && (await canEditBook(book.id))) redirect(`/book/${slug}/edit`);
  return <UnlockV2 slug={slug} theme={toThemeKey(book?.theme)} next={`/book/${slug}/edit`} />;
}
