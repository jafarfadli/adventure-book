"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBookV2 } from "@/actions/v2/shelf";
import { Sheet } from "@/components/editor-v2/Sheet";
import { ThemeRow } from "@/components/editor-v2/sheets/Pickers";
import { Icon, IconButton } from "@/components/v2/Icon";
import { GRAIN_URL, WorldDefs } from "@/components/world/art/defs";
import { Cover } from "@/components/world/Cover";
import { MusicButton } from "@/components/world/ReaderChrome";
import { KITS } from "@/components/world/themes";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";
import type { ShelfV2 } from "@/lib/v2/shelf";

// The landing page: the couple's books standing face-out on a paper shelf in
// a little diorama. Tap a book to open it; editors get a ghost book with ＋ to
// start the next volume.

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

export function Shelf({ shelf, canEdit, hrefSuffix }: { shelf: ShelfV2; canEdit: boolean; hrefSuffix: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<ThemeKey>(shelf.theme);
  const [busy, setBusy] = useState(false);
  const t = THEMES[shelf.theme];

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { slug } = await createBookV2(title.trim(), theme);
      router.push(`/book/${slug}/edit${hrefSuffix}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="fixed inset-0 overflow-hidden" style={{ background: t.sky, ...(themeCssVars(t) as React.CSSProperties) }}>
      <WorldDefs />
      <Backdrop theme={shelf.theme} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.32 }} />

      <div className="absolute inset-x-0 top-[10%] flex justify-center">
        <h1 className="-rotate-2 rounded-xl bg-[#fffaf2] px-5 py-2 font-hand text-3xl font-bold text-[var(--c4)] shadow-[2px_4px_8px_rgba(30,16,20,0.3)] sm:text-4xl">
          {shelf.title}
        </h1>
      </div>

      {/* the shelf: books stand on a paper plank */}
      <div className="absolute inset-x-0 bottom-[22%]">
        {/* centred when the books fit, scrollable (from the first book) when they do not */}
        <div className="max-w-full overflow-x-auto pt-10 [scrollbar-width:none]">
          <div className="mx-auto flex w-max items-end gap-[3vw] px-[8vw]">
          {shelf.books.map((b, i) => (
            <Link
              key={b.id}
              href={`/book/${b.slug}${hrefSuffix}`}
              aria-label={`${b.title} · vol. ${b.volume}`}
              title={`${b.title} · vol. ${b.volume}`}
              className="block w-[min(42vw,200px)] shrink-0 transition hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:outline-none"
              style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
            >
              <Cover book={b} />
            </Link>
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
      {!canEdit && shelf.books[0] && (
        <Link
          href={`/book/${shelf.books[0].slug}/edit${hrefSuffix}`}
          aria-label="Mode edit"
          title="Mode edit"
          className="absolute right-3 bottom-3 z-30 inline-grid h-10 w-10 place-items-center rounded-full bg-[#fffaf5]/95 text-[#2b2326] shadow-[0_2px_8px_rgba(40,10,30,0.2)]"
        >
          <Icon name="pencil" />
        </Link>
      )}

      {creating && (
        <Sheet label="Buku baru" onClose={() => setCreating(false)}>
          <div className="flex flex-col gap-4">
            <input
              aria-label="Judul buku"
              placeholder="Judul"
              autoFocus
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void create()}
              className="h-12 rounded-xl border border-[#e7dfe2] bg-white px-3 font-hand text-2xl font-bold text-[#2b2326] focus-visible:outline-2 focus-visible:outline-[#2b2326]"
            />
            <ThemeRow current={theme} bookTheme={theme} allowFollow={false} onPick={(k) => k && setTheme(k)} />
            <div className="flex justify-end">
              <IconButton icon={busy ? "spinner" : "check"} label="Buat buku" variant="primary" disabled={busy || !title.trim()} onClick={() => void create()} />
            </div>
          </div>
        </Sheet>
      )}
    </main>
  );
}
