"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateBookV2 } from "@/actions/v2/editor";
import { createBookV2, renameShelfV2 } from "@/actions/v2/shelf";
import { Sheet } from "@/components/editor-v2/Sheet";
import { BookPanel } from "@/components/editor-v2/sheets/BookPanel";
import { ThemeRow } from "@/components/editor-v2/sheets/Pickers";
import { Icon, IconButton } from "@/components/v2/Icon";
import { GRAIN_URL, WorldDefs } from "@/components/world/art/defs";
import { Cover } from "@/components/world/Cover";
import { MusicButton } from "@/components/world/ReaderChrome";
import { KITS } from "@/components/world/themes";
import type { BookPatch } from "@/lib/v2/edit";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";
import type { ShelfBook, ShelfV2 } from "@/lib/v2/shelf";

// The landing page: the couple's books standing face-out on a paper shelf in
// a little diorama. Tap a book to open it. Editors can rename the shelf in
// place, open a book's settings (title, cover, …) from the pencil on it, and
// start a new book with the ghost book's ＋.

const W = 1600;

function Backdrop({ theme }: { theme: ThemeKey }) {
  const kit = KITS[theme];
  const span = { x0: 0, x1: W, seed: 0, top: -240 };
  const sky = kit.sky(span);
  const mid = kit.mid(span);
  const ground = kit.ground(span);
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox={`0 -240 ${W} 960`} preserveAspectRatio="xMidYMax slice" style={themeCssVars(THEMES[theme]) as React.CSSProperties}>
      {sky.items}
      {mid.bands}
      {mid.items}
      {ground.bands}
    </svg>
  );
}

const TITLE_CARD = "-rotate-2 rounded-xl bg-[#fffaf2] px-5 py-2 font-hand text-3xl font-bold text-[var(--c4)] shadow-[2px_4px_8px_rgba(30,16,20,0.3)] sm:text-4xl";

/** The shelf's name on a paper card; editors tap it to rewrite it in place. */
function ShelfTitle({ title, canEdit, onRename }: { title: string; canEdit: boolean; onRename: (t: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (!canEdit) return <h1 className={TITLE_CARD}>{title}</h1>;
  if (draft !== null) {
    const done = () => {
      const t = draft.trim();
      setDraft(null);
      if (t && t !== title) onRename(t);
    };
    return (
      <input
        aria-label="Judul rak"
        autoFocus
        value={draft}
        maxLength={120}
        size={Math.max(6, draft.length + 1)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(null);
        }}
        className={`${TITLE_CARD} max-w-[90vw] text-center outline-2 outline-offset-4 outline-white`}
      />
    );
  }
  return (
    <h1>
      <button type="button" onClick={() => setDraft(title)} aria-label={`${title} · ubah judul rak`} title="Ubah judul rak" className={`${TITLE_CARD} inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}>
        {title}
        <Icon name="pencil" className="h-4 w-4 opacity-50" />
      </button>
    </h1>
  );
}

export function Shelf({ shelf, canEdit, hrefSuffix }: { shelf: ShelfV2; canEdit: boolean; hrefSuffix: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(shelf.title);
  const [books, setBooks] = useState(shelf.books);
  const [editing, setEditing] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTheme, setNewTheme] = useState<ThemeKey>(shelf.theme);
  const [busy, setBusy] = useState(false);
  const theme = books[0]?.theme ?? shelf.theme;
  const t = THEMES[theme];
  const open = books.find((b) => b.id === editing);

  /** Optimistic: shown at once, put back if the server refuses. */
  async function attempt(apply: () => void, undo: () => void, task: () => Promise<unknown>) {
    apply();
    setFailed(false);
    try {
      await task();
    } catch {
      undo();
      setFailed(true);
    }
  }

  function rename(next: string) {
    const prev = title;
    void attempt(() => setTitle(next), () => setTitle(prev), () => renameShelfV2(next));
  }

  function patchBook(book: ShelfBook, patch: BookPatch) {
    const mapTo = (b: ShelfBook) => setBooks((xs) => xs.map((x) => (x.id === book.id ? b : x)));
    const before = books.find((b) => b.id === book.id) ?? book;
    void attempt(() => mapTo({ ...before, ...(patch as Partial<ShelfBook>) }), () => mapTo(before), () => updateBookV2(book.id, patch));
  }

  async function create() {
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      const { slug } = await createBookV2(newTitle.trim(), newTheme);
      router.push(`/book/${slug}/edit${hrefSuffix}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="fixed inset-0 overflow-hidden" style={{ background: t.sky, ...(themeCssVars(t) as React.CSSProperties) }}>
      <WorldDefs />
      <Backdrop theme={theme} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.32 }} />

      <div className="absolute inset-x-0 top-[10%] flex justify-center">
        <ShelfTitle title={title} canEdit={canEdit} onRename={rename} />
      </div>

      {/* the shelf: books stand on a paper plank */}
      <div className="absolute inset-x-0 bottom-[22%]">
        {/* centred when the books fit, scrollable (from the first book) when they do not */}
        <div className="max-w-full overflow-x-auto pt-10 [scrollbar-width:none]">
          <div className="mx-auto flex w-max items-end gap-[3vw] px-[8vw]">
            {books.map((b, i) => (
              <div key={b.id} className="relative w-[min(42vw,200px)] shrink-0" style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                <Link
                  href={`/book/${b.slug}${hrefSuffix}`}
                  aria-label={b.title}
                  title={b.title}
                  className="block transition hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:outline-none"
                >
                  <Cover book={b} />
                </Link>
                {canEdit && (
                  <span className="absolute -top-3 -right-3 z-10">
                    <IconButton icon="pencil" label={`Ubah ${b.title}`} size="sm" variant="primary" onClick={() => setEditing(b.id)} />
                  </span>
                )}
              </div>
            ))}
            {canEdit && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                aria-label="Buku baru"
                title="Buku baru"
                className="grid aspect-[2/3] w-[min(30vw,140px)] shrink-0 place-items-center rounded-lg border-4 border-dashed border-white/80 bg-white/25 text-white transition hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-white"
              >
                <Icon name="plus" className="h-10 w-10" />
              </button>
            )}
          </div>
        </div>
        <div aria-hidden className="h-5 shadow-[0_8px_14px_rgba(30,16,20,0.35)]" style={{ background: "var(--c4)", borderTop: "5px solid var(--c2)" }} />
      </div>

      <div className="pointer-events-none absolute top-3 right-3 z-30 flex gap-2 [&>*]:pointer-events-auto">
        {failed && (
          <span className="inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#a3324f]">
            <Icon name="warning" title="Gagal menyimpan" />
          </span>
        )}
        <Link href={`/map${hrefSuffix}`} aria-label="Peta kenangan" title="Peta kenangan" className="inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)]">
          <Icon name="map" />
        </Link>
        <Link href={`/wishlist${hrefSuffix}`} aria-label="Wishlist" title="Wishlist" className="inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)]">
          <Icon name="spark" />
        </Link>
      </div>
      <div className="absolute bottom-3 left-3 z-30">
        <MusicButton />
      </div>
      {!canEdit && books[0] && (
        <Link
          href={`/book/${books[0].slug}/edit${hrefSuffix}`}
          aria-label="Mode edit"
          title="Mode edit"
          className="absolute right-3 bottom-3 z-30 inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)]"
        >
          <Icon name="pencil" />
        </Link>
      )}

      {open && (
        <Sheet label="Pengaturan buku" onClose={() => setEditing(null)}>
          <BookPanel
            book={open}
            onPatch={(p) => patchBook(open, p)}
            onDeleted={() => {
              setEditing(null);
              setBooks((xs) => xs.filter((x) => x.id !== open.id));
              router.refresh();
            }}
          />
        </Sheet>
      )}

      {creating && (
        <Sheet label="Buku baru" onClose={() => setCreating(false)}>
          <div className="flex flex-col gap-4">
            <input
              aria-label="Judul buku"
              placeholder="Judul"
              autoFocus
              value={newTitle}
              maxLength={120}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void create()}
              className="h-12 rounded-xl border border-[#e7dfe2] bg-white px-3 font-hand text-2xl font-bold text-[#2b2326] focus-visible:outline-2 focus-visible:outline-[#2b2326]"
            />
            <ThemeRow current={newTheme} bookTheme={newTheme} allowFollow={false} onPick={(k) => k && setNewTheme(k)} />
            <div className="flex justify-end">
              <IconButton icon={busy ? "spinner" : "check"} label="Buat buku" variant="primary" disabled={busy || !newTitle.trim()} onClick={() => void create()} />
            </div>
          </div>
        </Sheet>
      )}
    </main>
  );
}
