"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageDraft } from "@/actions/v2/editor";
import { Icon, IconButton } from "@/components/v2/Icon";
import { travelKeys } from "@/components/world/World";
import { WorldCanvas, type WorldCanvasHandle } from "@/components/world/WorldCanvas";
import { u } from "@/components/world/items/units";
import type { TemplateKey } from "@/lib/v2/templates";
import { THEMES } from "@/lib/v2/themes";
import type { BookV2, PageV2 } from "@/lib/v2/types";
import { GAP, layoutWorld } from "@/lib/v2/world";
import { Dock, type DockItem } from "./Dock";
import { Sheet } from "./Sheet";
import { AddPanel } from "./sheets/AddPanel";
import { BookPanel } from "./sheets/BookPanel";
import { LocationPanel } from "./sheets/LocationPanel";
import { PagesOverlay } from "./sheets/PagesOverlay";
import { DatePanel, TemplateGrid, ThemeRow } from "./sheets/Pickers";
import { isVideoFile, uploadMedia } from "./upload";
import { useEditorBook } from "./useEditorBook";

type Sel = { pageId: string; key: string };
type SheetKind = "template" | "theme" | "date" | "location" | "add" | "book" | "pages";

/**
 * The v2 editor: the very same world readers see, with things you can tap.
 * Tap empty space in a stop to select the stop, a photo to select the photo,
 * a caption or note to type in place. One dock of icons acts on the
 * selection; ＋ on the path adds stops right there. Everything saves itself.
 */
export function EditorWorld({ initial, readerHref }: { initial: BookV2; readerHref: string }) {
  const router = useRouter();
  const ed = useEditorBook(initial);
  const { book } = ed;
  const layout = useMemo(() => layoutWorld(book.pages, book.theme), [book.pages, book.theme]);
  const canvas = useRef<WorldCanvasHandle | null>(null);

  const [sel, setSel] = useState<Sel | null>(null);
  const [typing, setTyping] = useState<{ pageId: string; key: string; field: "caption" | "text" } | null>(null);
  const [focusing, setFocusing] = useState<Sel | null>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [insertAt, setInsertAt] = useState(0);
  const [jumpTo, setJumpTo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement | null>(null);

  const page: PageV2 | undefined = sel ? book.pages.find((p) => p.id === sel.pageId) : undefined;
  const slot = page && sel && sel.key !== "page" ? page.slots[sel.key] : undefined;

  // after adding or jumping, centre the stop once it is laid out
  useEffect(() => {
    if (!jumpTo) return;
    const st = layout.stops.find((s) => s.pageId === jumpTo);
    if (st) {
      canvas.current?.goTo(st.cx, true);
      setJumpTo(null);
    }
  }, [jumpTo, layout]);

  const clearSelection = useCallback(() => {
    setSel(null);
    setFocusing(null);
  }, []);

  function onItemsClick(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("input,textarea,button,a,video")) return;
    const section = t.closest("section[data-page]");
    if (!section) return clearSelection();
    const pageId = section.getAttribute("data-page")!;
    if (focusing && focusing.pageId === pageId && t.closest(`[data-slot="${focusing.key}"]`)) return;
    setFocusing(null);
    // a newly picked stop slides to the middle so its tools never cover it
    if (sel?.pageId !== pageId) {
      const st = layout.stops.find((x) => x.pageId === pageId);
      if (st) canvas.current?.goTo(st.cx, true);
    }
    const cap = t.closest<HTMLElement>("[data-caption]");
    if (cap) {
      const key = cap.dataset.caption!;
      setSel({ pageId, key });
      setTyping({ pageId, key, field: "caption" });
      return;
    }
    if (t.closest("[data-text]")) {
      setSel({ pageId, key: "text1" });
      setTyping({ pageId, key: "text1", field: "text" });
      return;
    }
    const media = t.closest<HTMLElement>("[data-slot]");
    if (media) return setSel({ pageId, key: media.dataset.slot! });
    setSel({ pageId, key: "page" });
  }

  const station = useCallback(
    (p: PageV2) => ({
      selected: sel?.pageId === p.id ? sel.key : null,
      typing: typing?.pageId === p.id ? { key: typing.key, field: typing.field } : null,
      focusing: focusing?.pageId === p.id ? focusing.key : null,
      onType: (key: string, field: "caption" | "text", v: string) => ed.type(p.id, key, field, v),
      onTypeDone: () => {
        ed.endTyping();
        setTyping(null);
      },
      onFocus: (key: string, x: number, y: number, done: boolean) => ed.focus(p.id, key, x, y, done),
    }),
    [sel, typing, focusing, ed],
  );

  // ＋ on the path in every gap: adds stops right there
  const overlay = useCallback(() => {
    if (typing) return null;
    const marks: { x: number; index: number }[] = [];
    let stopsBefore = 0;
    layout.segments.forEach((seg, i) => {
      if (seg.kind === "stop") stopsBefore++;
      if (i < layout.segments.length - 1) marks.push({ x: seg.x + seg.w + GAP / 2, index: stopsBefore });
    });
    return marks.map((m) => (
      <button
        key={m.x}
        type="button"
        aria-label="Tambah halaman di sini"
        title="Tambah halaman di sini"
        onClick={(e) => {
          e.stopPropagation();
          setInsertAt(m.index);
          setSheet("add");
        }}
        className="absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-dashed border-white/95 bg-[#2b2326]/60 text-white shadow transition hover:bg-[#2b2326]/80 focus-visible:outline-2 focus-visible:outline-white"
        style={{ left: u(m.x), top: u(642) }}
      >
        <Icon name="plus" className="h-4 w-4" />
      </button>
    ));
  }, [layout, typing]);

  async function onSwap(f: File) {
    if (!page || !sel || sel.key === "page") return;
    setUploading(true);
    try {
      const r = await uploadMedia(f);
      ed.editSlot(page.id, sel.key, {
        imageUrl: r.imageUrl,
        thumbUrl: r.thumbUrl,
        ...(r.videoUrl ? { videoUrl: r.videoUrl } : {}),
        width: r.width ?? null,
        height: r.height ?? null,
        takenAt: r.takenAt ?? null,
        focusX: 0.5,
        focusY: 0.5,
        ...(r.lat != null && r.lng != null && slot?.locationSource !== "manual"
          ? { lat: r.lat, lng: r.lng, locationSource: "exif" as const }
          : {}),
      });
    } catch {
      // the warning stays visible on the status icon; nothing changed
    } finally {
      setUploading(false);
    }
  }

  async function addStops(drafts: PageDraft[]) {
    const created = await ed.createPages(insertAt, drafts);
    setSheet(null);
    if (created[0]) {
      setJumpTo(created[0].id);
      setSel({ pageId: created[0].id, key: "page" });
    }
  }

  let dock: DockItem[] = [];
  if (focusing) {
    dock = [{ icon: "check", label: "Selesai mengatur fokus", onClick: () => setFocusing(null) }];
  } else if (page && sel?.key === "page") {
    dock = [
      { icon: "layout", label: "Template", onClick: () => setSheet("template") },
      { icon: "spark", label: "Tema halaman", swatch: THEMES[page.theme].c3, onClick: () => setSheet("theme") },
      { icon: "dice", label: "Acak dekorasi", onClick: () => ed.setSeed(page.id, (page.decorSeed + 1) % 1_000_000) },
      {
        icon: "trash",
        label: "Hapus halaman",
        danger: true,
        onClick: () => {
          ed.deletePage(page.id);
          clearSelection();
        },
      },
    ];
  } else if (page && sel && slot && (slot.type === "PHOTO" || slot.type === "VIDEO")) {
    const hasMedia = Boolean(slot.imageUrl);
    dock = [
      { icon: uploading ? "spinner" : "swap", label: slot.type === "VIDEO" ? "Ganti video" : "Ganti foto", onClick: () => file.current?.click() },
      ...(hasMedia ? [{ icon: "focus" as const, label: "Atur fokus", onClick: () => setFocusing(sel) }] : []),
      { icon: "text", label: "Caption", onClick: () => setTyping({ pageId: page.id, key: sel.key, field: "caption" }) },
      { icon: "calendar", label: "Tanggal", onClick: () => setSheet("date") },
      { icon: "pin", label: "Lokasi", onClick: () => setSheet("location") },
      ...(hasMedia
        ? [
            {
              icon: "trash" as const,
              label: "Kosongkan",
              danger: true,
              onClick: () =>
                ed.editSlot(page.id, sel.key, { imageUrl: null, thumbUrl: null, videoUrl: null, width: null, height: null }),
            },
          ]
        : []),
    ];
  } else if (page && sel?.key === "text1") {
    dock = [
      { icon: "pencil", label: "Tulis", onClick: () => setTyping({ pageId: page.id, key: "text1", field: "text" }) },
      { icon: "trash", label: "Kosongkan tulisan", danger: true, onClick: () => ed.editSlot(page.id, "text1", { text: null }) },
    ];
  }

  const statusIcon =
    ed.status === "saving" ? (
      <span title="Menyimpan" aria-label="Menyimpan" className="grid h-10 w-10 place-items-center text-[#2b2326]">
        <Icon name="spinner" />
      </span>
    ) : ed.status === "error" ? (
      <IconButton icon="warning" label="Gagal menyimpan — coba lagi" onClick={ed.retry} className="text-[#a3324f]" />
    ) : (
      <span title="Tersimpan" aria-label="Tersimpan" className="grid h-10 w-10 place-items-center text-[#2b7353]">
        <Icon name="cloud-check" />
      </span>
    );

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: THEMES[layout.slices[0].theme].sky }}>
      <WorldCanvas
        ref={canvas}
        book={book}
        layout={layout}
        onKeyDown={(e, api) => {
          if (e.key === "Escape") return clearSelection();
          travelKeys(layout.stops, layout.width)(e, api);
        }}
        wishlistHref={`/book/${book.slug}/wishlist`}
        overlay={overlay}
        station={station}
        onItemsPointer={onItemsClick}
        label={`Mengedit ${book.title}`}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex items-center justify-between [&>*]:pointer-events-auto">
        <div className="flex items-center gap-2">
          <IconButton icon="check" label="Selesai" variant="primary" onClick={() => router.push(readerHref)} />
          <IconButton icon="undo" label="Urungkan" onClick={ed.undo} disabled={!ed.canUndo} />
          {statusIcon}
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon="grid" label="Semua halaman" onClick={() => setSheet("pages")} />
          <IconButton icon="book" label="Pengaturan buku" onClick={() => setSheet("book")} />
        </div>
      </div>

      <Dock items={dock} />
      <input
        ref={file}
        type="file"
        className="hidden"
        accept={slot?.type === "VIDEO" ? "video/*" : "image/*"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && (slot?.type === "VIDEO") === isVideoFile(f)) void onSwap(f);
        }}
      />

      {sheet === "template" && page && (
        <Sheet label="Template" onClose={() => setSheet(null)}>
          <TemplateGrid
            current={page.template}
            onPick={(t: TemplateKey) => {
              ed.setTemplate(page.id, t);
              setSheet(null);
            }}
          />
        </Sheet>
      )}
      {sheet === "theme" && page && (
        <Sheet label="Tema halaman" onClose={() => setSheet(null)}>
          <ThemeRow
            current={page.ownTheme}
            bookTheme={book.theme}
            onPick={(t) => {
              ed.setTheme(page.id, t);
              setSheet(null);
            }}
          />
        </Sheet>
      )}
      {sheet === "date" && page && sel && slot && (
        <Sheet label="Tanggal" onClose={() => setSheet(null)}>
          <DatePanel slot={slot} onChange={(p) => ed.editSlot(page.id, sel.key, p)} onDone={() => setSheet(null)} />
        </Sheet>
      )}
      {sheet === "location" && page && sel && slot && (
        <Sheet label="Lokasi" onClose={() => setSheet(null)}>
          <LocationPanel slot={slot} onSave={(p) => ed.editSlot(page.id, sel.key, p)} onClose={() => setSheet(null)} />
        </Sheet>
      )}
      {sheet === "add" && (
        <Sheet label="Tambah halaman" onClose={() => setSheet(null)} wide>
          <AddPanel
            onEmpty={(t) => void addStops([{ template: t, theme: null, slots: {} }])}
            onCreate={addStops}
          />
        </Sheet>
      )}
      {sheet === "book" && (
        <Sheet label="Pengaturan buku" onClose={() => setSheet(null)}>
          <BookPanel book={book} onPatch={(p) => ed.editBook(p)} />
        </Sheet>
      )}
      {sheet === "pages" && (
        <PagesOverlay
          pages={book.pages}
          onReorder={(ids) => ed.reorder(ids)}
          onJump={(id) => {
            setSheet(null);
            setJumpTo(id);
            setSel({ pageId: id, key: "page" });
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
