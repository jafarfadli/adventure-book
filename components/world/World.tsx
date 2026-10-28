"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { THEMES } from "@/lib/v2/themes";
import type { BookV2 } from "@/lib/v2/types";
import { layoutWorld } from "@/lib/v2/world";
import { CoverOverlay } from "./Cover";
import { useReducedMotion } from "./hooks";
import { EditLink, MusicButton, TopChrome } from "./ReaderChrome";
import { Timeline, type TimelineHandle } from "./Timeline";
import { WorldCanvas, type WorldCanvasHandle } from "./WorldCanvas";

/** Arrow keys: next/previous stop; Home/End: the two ends of the path. */
export function travelKeys(stops: { cx: number }[], width: number) {
  return (e: React.KeyboardEvent, api: WorldCanvasHandle) => {
    const cx = api.centre();
    if (e.key === "ArrowRight") {
      const next = stops.find((st) => st.cx > cx + 20);
      api.goTo(next ? next.cx : width, true);
    } else if (e.key === "ArrowLeft") {
      const prev = [...stops].reverse().find((st) => st.cx < cx - 20);
      api.goTo(prev ? prev.cx : 0, true);
    } else if (e.key === "Home") {
      api.goTo(0, true);
    } else if (e.key === "End") {
      api.goTo(width, true);
    } else {
      return;
    }
    e.preventDefault();
  };
}

/**
 * The v2 reader: one book as a single paper world you keep swiping through,
 * with a shut cover in front on the first visit and icon chrome on top.
 */
export function World({
  book,
  initialPageId,
  initialOrder,
  hrefSuffix = "",
}: {
  book: BookV2;
  /** ?p=<pageId> */
  initialPageId?: string | null;
  /** legacy ?page=<order> from v1 map links */
  initialOrder?: number | null;
  /** appended to internal links, e.g. "?v=2" while previewing */
  hrefSuffix?: string;
}) {
  const layout = useMemo(() => layoutWorld(book.pages, book.theme), [book.pages, book.theme]);
  const reduce = useReducedMotion();
  const canvas = useRef<WorldCanvasHandle | null>(null);
  const timeline = useRef<TimelineHandle | null>(null);
  const [metrics, setMetrics] = useState({ s: 1, vw: 1, maxScroll: 1 });

  const deepTarget = useMemo(() => {
    if (initialPageId) return layout.stops.find((st) => st.pageId === initialPageId) ?? null;
    if (initialOrder != null) {
      const page = book.pages.find((p) => p.order >= initialOrder);
      return page ? (layout.stops.find((st) => st.pageId === page.id) ?? null) : null;
    }
    return null;
  }, [initialPageId, initialOrder, layout, book.pages]);

  // the shut cover: first visit per session, never for deep links
  const [coverOpen, setCoverOpen] = useState<boolean | null>(null);
  const [backCover, setBackCover] = useState(false);
  useEffect(() => {
    const seen = sessionStorage.getItem(`ab-opened:${book.slug}`) === "1";
    setCoverOpen(!(seen || deepTarget));
  }, [book.slug, deepTarget]);

  const closeCover = useCallback(() => {
    sessionStorage.setItem(`ab-opened:${book.slug}`, "1");
    setCoverOpen(false);
    canvas.current?.stage()?.focus({ preventScroll: true });
  }, [book.slug]);

  const { s, vw, maxScroll } = metrics;
  const marks = useMemo(
    () =>
      layout.stops.map((st) => ({
        p: maxScroll > 1 ? Math.min(1, Math.max(0, (st.cx * s - vw / 2) / maxScroll)) : 0,
        label: st.monthShort,
        title: `Halaman ${st.index + 1}`,
      })),
    [layout.stops, s, vw, maxScroll],
  );

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: THEMES[layout.slices[0].theme].sky }}>
      <WorldCanvas
        ref={canvas}
        book={book}
        layout={layout}
        initialX={deepTarget ? deepTarget.cx : null}
        onProgress={(p) => timeline.current?.setProgress(p)}
        onMetrics={setMetrics}
        onKeyDown={travelKeys(layout.stops, layout.width)}
        wishlistHref={`/book/${book.slug}/wishlist`}
        onCloseBook={() => setBackCover(true)}
        label={`${book.title} — geser untuk membaca`}
      />

      <TopChrome mapHref={`/book/${book.slug}/map`} wishlistHref={`/book/${book.slug}/wishlist`} shareTitle={book.title} />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex items-center gap-2 [&>*]:pointer-events-auto">
        <MusicButton />
        <Timeline ref={timeline} marks={marks} onSeek={(p, smooth) => canvas.current?.seek(p, smooth)} />
        <EditLink href={`/book/${book.slug}/edit${hrefSuffix}`} />
      </div>

      {coverOpen && <CoverOverlay book={book} reduceMotion={reduce} onDone={closeCover} label="Buka buku" />}
      {backCover && (
        <CoverOverlay
          book={book}
          back
          reduceMotion={reduce}
          label="Buka lagi dari awal"
          onDone={() => {
            setBackCover(false);
            canvas.current?.goTo(0, false);
          }}
        />
      )}
    </div>
  );
}
