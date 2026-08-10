"use client";

import { Reorder } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { deletePage, reorderPages } from "@/actions/pages";
import type { BookMeta } from "@/components/reader/layouts";
import { LAYOUTS } from "@/lib/layouts";
import type { PageData } from "@/lib/types";
import { PageEditor } from "./PageEditor";

export function PageList({
  bookId,
  pages,
  bookMeta,
  themeKey,
}: {
  bookId: string;
  pages: PageData[];
  bookMeta: BookMeta;
  themeKey: string;
}) {
  const [items, setItems] = useState(pages);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Adopt fresh server data after create/delete/reorder revalidation.
  useEffect(() => setItems(pages), [pages]);

  function commitOrder() {
    const currentIds = items.map((p) => p.id);
    const serverIds = pages.map((p) => p.id);
    if (currentIds.join() === serverIds.join()) return;
    setError(null);
    startTransition(async () => {
      try {
        await reorderPages(bookId, currentIds);
      } catch {
        setError("Gagal menyimpan urutan. Coba lagi, ya.");
        setItems(pages);
      }
    });
  }

  function onDelete(page: PageData) {
    const label = LAYOUTS[page.layout].label;
    if (!confirm(`Hapus halaman "${label}"? Isi halaman ikut terhapus.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePage(page.id);
      } catch {
        setError("Gagal menghapus halaman. Coba lagi, ya.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-white/70 p-5 text-sm text-stone-500 shadow-sm">
        Belum ada halaman. Tambah halaman pertama di bawah, yuk.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="flex flex-col gap-2"
      >
        {items.map((page, i) => {
          const expanded = expandedId === page.id;
          return (
            <Reorder.Item
              key={page.id}
              value={page}
              onDragEnd={commitOrder}
              className="rounded-lg bg-white/70 shadow-sm"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  title="Seret untuk mengubah urutan"
                  className="cursor-grab select-none text-lg text-stone-400 active:cursor-grabbing"
                >
                  ⠿
                </span>
                <span className="w-8 text-sm tabular-nums text-stone-400">
                  {i + 1}.
                </span>
                <span className="flex-1 text-sm text-stone-700">
                  {LAYOUTS[page.layout].label}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : page.id)}
                  className="rounded-md px-2 py-1 text-sm text-stone-700 transition hover:bg-stone-100 focus-visible:outline-2"
                  aria-expanded={expanded}
                >
                  {expanded ? "Tutup" : "Edit isi"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(page)}
                  disabled={pending}
                  className="rounded-md px-2 py-1 text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 focus-visible:outline-2"
                  aria-label={`Hapus halaman ${i + 1}`}
                >
                  Hapus
                </button>
              </div>
              {expanded && (
                <PageEditor page={page} bookMeta={bookMeta} themeKey={themeKey} />
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
