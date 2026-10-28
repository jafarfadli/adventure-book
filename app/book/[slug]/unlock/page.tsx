import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UnlockForm } from "@/components/editor/UnlockForm";
import { UnlockV2 } from "@/components/editor-v2/UnlockV2";
import { getEditorBookId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isV2, v2Suffix } from "@/lib/v2/flag";
import { toThemeKey } from "@/lib/v2/themes";

export const metadata: Metadata = { title: "Buka mode edit — Adventure Book" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export default async function UnlockPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  if (isV2(sp.v)) {
    const suffix = v2Suffix(sp.v);
    const book = await prisma.book.findUnique({ where: { slug }, select: { id: true, theme: true } });
    // never reveal whether a slug exists: an unknown book just shows the form
    if (book && (await getEditorBookId()) === book.id) redirect(`/book/${slug}/edit${suffix}`);
    return <UnlockV2 slug={slug} theme={toThemeKey(book?.theme)} next={`/book/${slug}/edit${suffix}`} />;
  }

  // Already unlocked for this book? Straight to the editor.
  const sessionBookId = await getEditorBookId();
  if (sessionBookId) {
    const book = await prisma.book.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (book && book.id === sessionBookId) redirect(`/book/${slug}/edit`);
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-[#e3d5bc] p-6">
      <div className="w-full max-w-sm rounded-lg bg-[#f5eddb] p-8 shadow-xl shadow-black/20">
        <h1 className="font-hand text-4xl text-stone-800">Mode edit</h1>
        <p className="mt-1 mb-6 text-sm text-stone-500">
          Masukkan password buku untuk mulai mengedit.
        </p>
        <UnlockForm slug={slug} />
        <Link
          href={`/book/${slug}`}
          className="mt-4 block text-center text-sm text-stone-500 underline-offset-2 hover:underline"
        >
          ← Kembali ke buku
        </Link>
      </div>
    </main>
  );
}
