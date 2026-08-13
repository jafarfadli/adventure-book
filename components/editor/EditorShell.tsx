"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateBookMeta } from "@/actions/book";
import { upsertSlot } from "@/actions/slots";
import { MusicToggle } from "@/components/reader/MusicToggle";
import { ToastProvider, useToast } from "@/components/ui/Toaster";
import { LAYOUTS } from "@/lib/layouts";
import type { PageData, SlotData } from "@/lib/types";
import { AddPageForm } from "./AddPageForm";
import { MetaEditor, type BookMetaDraft } from "./MetaEditor";
import { PageList } from "./PageList";

type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  theme: string;
  coverImageUrl: string | null;
  pages: PageData[];
};

function EditorInner({ book }: { book: Book }) {
  const [meta, setMeta] = useState<BookMetaDraft>({
    title: book.title,
    subtitle: book.subtitle ?? "",
  });
  // pageId -> slot drafts, kept here so collapsing a page never loses edits
  // and one save can write the whole book at once.
  const [drafts, setDrafts] = useState<Record<string, Record<string, SlotData>>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function onDraftChange(pageId: string, slots: Record<string, SlotData>) {
    setSaved(false);
    setDrafts((prev) => ({ ...prev, [pageId]: slots }));
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      try {
        await updateBookMeta(book.id, meta);
        for (const [pageId, slots] of Object.entries(drafts)) {
          const page = book.pages.find((p) => p.id === pageId);
          if (!page) continue;
          for (const spec of LAYOUTS[page.layout].slots) {
            const s = slots[spec.key];
            if (!s) continue;
            await upsertSlot(pageId, spec.key, {
              caption: s.caption,
              text: s.text,
              imageUrl: s.imageUrl,
              thumbUrl: s.thumbUrl,
              videoUrl: s.videoUrl,
              aspect: s.aspect,
              rotation: s.rotation,
              tapeStyle: s.tapeStyle,
              dateLabel: s.dateLabel,
              lat: s.lat,
              lng: s.lng,
              locationLabel: s.locationLabel,
              locationSource: s.locationSource as "exif" | "manual" | null,
            });
          }
        }
        setSaved(true);
      } catch {
        toast("Gagal menyimpan. Coba lagi, ya.");
      }
    });
  }

  return (
    <main className="min-h-dvh flex-1 bg-stone-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 py-8 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Mode edit</h1>
            <p className="text-sm text-stone-500">{meta.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-sm text-emerald-700">Tersimpan ✓</span>}
            <Link
              href={`/book/${book.slug}`}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700 transition hover:bg-white focus-visible:outline-2"
            >
              Lihat buku
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-md bg-stone-800 px-3 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </header>

        <MetaEditor value={meta} onChange={(v) => { setSaved(false); setMeta(v); }} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Halaman ({book.pages.length})
          </h2>
          <PageList
            bookId={book.id}
            pages={book.pages}
            bookMeta={{ title: meta.title, subtitle: meta.subtitle || null }}
            themeKey={book.theme}
            drafts={drafts}
            onDraftChange={onDraftChange}
          />
          <AddPageForm bookId={book.id} />
        </section>
      </div>
      <MusicToggle className="fixed bottom-4 left-4 z-30 text-stone-500" />
    </main>
  );
}

export function EditorShell({ book }: { book: Book }) {
  return (
    <ToastProvider>
      <EditorInner book={book} />
    </ToastProvider>
  );
}
