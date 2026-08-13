"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  addWishlistItem,
  deleteWishlistItem,
  toggleWishlistItem,
} from "@/actions/wishlist";
import { MusicToggle } from "@/components/reader/MusicToggle";
import { IconCheck, IconPencil } from "@/components/ui/icons";
import { ToastProvider, useToast } from "@/components/ui/Toaster";
import type { Theme } from "@/lib/themes";

export type WishItem = {
  id: string;
  text: string;
  done: boolean;
  doneAt: string | null;
};

function WishRow({
  item,
  canEdit,
  onToggle,
  onDelete,
  theme,
}: {
  item: WishItem;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
  theme: Theme;
}) {
  return (
    <li className="group flex items-start gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={!canEdit}
        aria-pressed={item.done}
        aria-label={item.done ? `Batalkan "${item.text}"` : `Tandai selesai: "${item.text}"`}
        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-2 border-stone-500/50 bg-white/60 transition ${
          canEdit ? "hover:border-stone-600 hover:bg-white" : "cursor-default"
        } focus-visible:outline-2 focus-visible:outline-offset-2`}
        style={{ transform: "rotate(-2deg)" }}
      >
        <IconCheck
          className={`h-5 w-5 text-rose-700 transition-opacity ${
            item.done ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>

      <div className="min-w-0 flex-1 pt-0.5">
        <span className="relative inline-block">
          <span
            className={`font-hand text-2xl leading-snug transition-opacity ${theme.ink} ${
              item.done ? "opacity-45" : "opacity-100"
            }`}
          >
            {item.text}
          </span>
          {/* Pen stroke rather than a CSS line-through: slightly askew,
              rounded ends, and it draws itself in from the left. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute top-1/2 left-0 h-[2px] w-full origin-left -rotate-[0.8deg] rounded-full bg-rose-800/60 transition-transform duration-300 ease-out ${
              item.done ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </span>
        {item.done && item.doneAt && (
          <span className={`mt-0.5 block font-hand text-lg ${theme.inkSoft}`}>
            done {item.doneAt} ✓
          </span>
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus "${item.text}"`}
          className="mt-1.5 shrink-0 rounded-md px-2 py-1 font-hand text-lg text-rose-700/70 opacity-70 transition hover:bg-rose-50 hover:opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          hapus
        </button>
      )}
    </li>
  );
}

function WishlistInner({
  bookId,
  slug,
  items,
  canEdit,
  theme,
}: {
  bookId: string;
  slug: string;
  items: WishItem[];
  /** Read view and edit view are separate routes, like the book. */
  canEdit: boolean;
  theme: Theme;
}) {
  const [list, setList] = useState(items);
  const [text, setText] = useState("");
  // The add field stays out of the way until asked for, so the list reads
  // as a clean checklist.
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();

  // Adopt server state after each revalidation.
  useEffect(() => setList(items), [items]);

  function onToggle(item: WishItem) {
    if (!canEdit) return;
    // Optimistic: flip now, reconcile when the action returns.
    setList((l) => l.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    startTransition(async () => {
      try {
        await toggleWishlistItem(item.id);
      } catch {
        setList(items);
        toast("Gagal menyimpan. Coba lagi, ya.");
      }
    });
  }

  function onDelete(item: WishItem) {
    if (!confirm(`Hapus "${item.text}" dari wishlist?`)) return;
    setList((l) => l.filter((i) => i.id !== item.id));
    startTransition(async () => {
      try {
        await deleteWishlistItem(item.id);
      } catch {
        setList(items);
        toast("Gagal menghapus. Coba lagi, ya.");
      }
    });
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    startTransition(async () => {
      try {
        await addWishlistItem(bookId, value);
      } catch {
        setText(value);
        toast("Gagal menambah. Coba lagi, ya.");
      }
    });
  }

  function closeAdd() {
    setAdding(false);
    setText("");
  }

  const remaining = list.filter((i) => !i.done).length;

  return (
    <>
      <Link
        href={canEdit ? `/book/${slug}/wishlist` : `/book/${slug}`}
        className={`fixed top-4 left-4 z-30 font-hand text-lg opacity-60 transition hover:opacity-100 ${theme.inkSoft}`}
      >
        ← {canEdit ? "Selesai" : "Kembali ke buku"}
      </Link>

      <div className="mx-auto w-full max-w-xl">
        <div className="paper-texture relative rounded-sm bg-[#f7f0e0] p-6 shadow-2xl shadow-black/25 md:p-9">
          <span
            aria-hidden
            className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-2 bg-amber-200/80 shadow-sm"
          />
          <h1 className={`font-hand text-4xl ${theme.ink}`}>Wishlist kita ✨</h1>
          <p className={`mt-1 font-hand-alt text-base ${theme.inkSoft}`}>
            {list.length === 0
              ? "Hal-hal yang mau kita lakuin bareng"
              : remaining === 0
                ? "Semua done! Waktunya nulis yang baru 🎉"
                : `${remaining} hal lagi yang mau kita lakuin bareng`}
          </p>

          {list.length === 0 ? (
            <p className={`mt-8 font-hand text-2xl ${theme.inkSoft}`}>
              Belum ada wishlist — tulis hal pertama yang mau kalian lakuin bareng ✨
            </p>
          ) : (
            <ul className="mt-7 flex flex-col gap-4">
              {list.map((item) => (
                <WishRow
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onToggle={() => onToggle(item)}
                  onDelete={() => onDelete(item)}
                  theme={theme}
                />
              ))}
            </ul>
          )}

          {/* Adding lives in the edit route only; the read view keeps a clean
              bottom edge with nothing under the list. */}
          {canEdit && (
            <div className="mt-8 border-t border-stone-400/25 pt-5">
              {adding ? (
                <form onSubmit={onAdd} className="flex items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && closeAdd()}
                    autoFocus
                    maxLength={200}
                    placeholder="mau ke mana lagi kita?"
                    aria-label="Tulis wishlist baru"
                    className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white/70 px-3 py-2 font-hand text-xl text-stone-800 placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-1"
                  />
                  <button
                    type="submit"
                    disabled={text.trim().length === 0}
                    className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Tambah
                  </button>
                  <button
                    type="button"
                    onClick={closeAdd}
                    aria-label="Batal menambah wishlist"
                    className="rounded-md px-2 py-2 font-hand text-lg text-stone-500 transition hover:text-stone-800 focus-visible:outline-2"
                  >
                    batal
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className={`inline-flex items-center gap-2 font-hand text-xl opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.inkSoft}`}
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-[7px] border-2 border-dashed border-stone-500/50 text-lg leading-none"
                    style={{ transform: "rotate(-2deg)" }}
                  >
                    +
                  </span>
                  tambah wishlist
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <MusicToggle className={`fixed bottom-4 left-4 z-30 ${theme.inkSoft}`} />
      {!canEdit && (
        <Link
          href={`/book/${slug}/wishlist/edit`}
          className={`fixed right-4 bottom-4 z-30 inline-flex items-center gap-1.5 font-hand text-lg opacity-40 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
          aria-label="Edit wishlist"
        >
          <IconPencil className="h-4 w-4" /> edit
        </Link>
      )}
    </>
  );
}

export function WishlistView(props: {
  bookId: string;
  slug: string;
  items: WishItem[];
  canEdit: boolean;
  theme: Theme;
}) {
  return (
    <ToastProvider>
      <WishlistInner {...props} />
    </ToastProvider>
  );
}
