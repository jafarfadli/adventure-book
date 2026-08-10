"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/Toaster";
import { withBase } from "@/lib/basePath";
import type { PageData } from "@/lib/types";
import { AddPageForm } from "./AddPageForm";
import { MetaEditor } from "./MetaEditor";
import { PageList } from "./PageList";

export function EditorShell({
  book,
}: {
  book: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    theme: string;
    coverImageUrl: string | null;
    pages: PageData[];
  };
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function finishEditing() {
    setLeaving(true);
    await fetch(withBase("/api/session"), { method: "DELETE" }).catch(() => null);
    router.push(`/book/${book.slug}`);
    router.refresh();
  }

  return (
    <ToastProvider>
      <main className="min-h-dvh flex-1 bg-stone-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 py-8 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Mode edit</h1>
            <p className="text-sm text-stone-500">{book.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/book/${book.slug}`}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 transition hover:bg-white focus-visible:outline-2"
            >
              Lihat buku
            </Link>
            <button
              type="button"
              onClick={finishEditing}
              disabled={leaving}
              className="rounded-md bg-stone-800 px-3 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {leaving ? "Keluar…" : "Selesai edit"}
            </button>
          </div>
        </header>

        <MetaEditor
          bookId={book.id}
          initial={{
            title: book.title,
            subtitle: book.subtitle,
            theme: book.theme,
            coverImageUrl: book.coverImageUrl,
          }}
        />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Halaman ({book.pages.length})
          </h2>
          <PageList
            bookId={book.id}
            pages={book.pages}
            bookMeta={{ title: book.title, subtitle: book.subtitle }}
            themeKey={book.theme}
          />
          <AddPageForm bookId={book.id} />
        </section>
      </div>
      </main>
    </ToastProvider>
  );
}
