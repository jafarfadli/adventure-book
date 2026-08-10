"use client";

import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { deletePage, reorderPages } from "@/actions/pages";
import type { BookMeta } from "@/components/reader/layouts";
import { useToast } from "@/components/ui/Toaster";
import { LAYOUTS } from "@/lib/layouts";
import type { PageData } from "@/lib/types";
import { PageEditor } from "./PageEditor";

function PageListItem({
  page,
  index,
  expanded,
  pending,
  onToggle,
  onDelete,
  onDragEnd,
  children,
}: {
  page: PageData;
  index: number;
  expanded: boolean;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  // Drag starts only from the ⠿ handle — swiping the expanded editor
  // (or the rest of the row) must scroll, not reorder.
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={page}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="rounded-lg bg-white/70 shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          title="Seret untuk mengubah urutan"
          aria-label={`Seret untuk memindahkan halaman ${index + 1}`}
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          className="cursor-grab touch-none select-none text-lg text-stone-400 active:cursor-grabbing"
        >
          ⠿
        </span>
        <span className="w-8 text-sm tabular-nums text-stone-400">{index + 1}.</span>
        <span className="flex-1 text-sm text-stone-700">
          {LAYOUTS[page.layout].label}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md px-2 py-1 text-sm text-stone-700 transition hover:bg-stone-100 focus-visible:outline-2"
          aria-expanded={expanded}
        >
          {expanded ? "Tutup" : "Edit isi"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-md px-2 py-1 text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 focus-visible:outline-2"
          aria-label={`Hapus halaman ${index + 1}`}
        >
          Hapus
        </button>
      </div>
      {expanded && children}
    </Reorder.Item>
  );
}

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
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Adopt fresh server data after create/delete/reorder revalidation.
  useEffect(() => setItems(pages), [pages]);

  function commitOrder() {
    const currentIds = items.map((p) => p.id);
    const serverIds = pages.map((p) => p.id);
    if (currentIds.join() === serverIds.join()) return;
    startTransition(async () => {
      try {
        await reorderPages(bookId, currentIds);
      } catch {
        toast("Gagal menyimpan urutan. Coba lagi, ya.");
        setItems(pages);
      }
    });
  }

  function onDelete(page: PageData) {
    const label = LAYOUTS[page.layout].label;
    if (!confirm(`Hapus halaman "${label}"? Isi halaman ikut terhapus.`)) return;
    startTransition(async () => {
      try {
        await deletePage(page.id);
      } catch {
        toast("Gagal menghapus halaman. Coba lagi, ya.");
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
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={setItems}
      className="flex flex-col gap-2"
    >
      {items.map((page, i) => (
        <PageListItem
          key={page.id}
          page={page}
          index={i}
          expanded={expandedId === page.id}
          pending={pending}
          onToggle={() => setExpandedId(expandedId === page.id ? null : page.id)}
          onDelete={() => onDelete(page)}
          onDragEnd={commitOrder}
        >
          <PageEditor page={page} bookMeta={bookMeta} themeKey={themeKey} />
        </PageListItem>
      ))}
    </Reorder.Group>
  );
}
