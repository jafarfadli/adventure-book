"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { worldScale } from "@/lib/v2/scale";
import { THEMES } from "@/lib/v2/themes";
import type { BookV2 } from "@/lib/v2/types";
import { layoutWorld, skyAt } from "@/lib/v2/world";
import { GRAIN_URL, WorldDefs } from "./art/defs";
import { CoverOverlay } from "./Cover";
import { useReducedMotion, useSize } from "./hooks";
import { Items } from "./Items";
import { EditLink, MusicButton, TopChrome } from "./ReaderChrome";
import { SceneryLayer, type LayerName } from "./Scenery";
import { Timeline, type TimelineHandle } from "./Timeline";

const PARALLAX: Record<LayerName, number> = { sky: 0.22, mid: 0.55, ground: 1, front: 1.16 };
const FLAT: Record<LayerName, number> = { sky: 1, mid: 1, ground: 1, front: 1 };

/**
 * The v2 reader: one book as a single paper world you keep swiping through.
 * Native horizontal scrolling carries the momentum; one rAF-throttled scroll
 * handler moves the parallax layers, tints the sky and slides the timeline
 * knob — nothing re-renders while scrolling.
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
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { w: vw, h: vh } = useSize(stage);
  const reduce = useReducedMotion();
  const ready = vw > 0 && vh > 0;
  const { s, bandTop, topU, bottomU } = worldScale(vw || 1, vh || 1);
  const layout = useMemo(() => layoutWorld(book.pages, book.theme), [book.pages, book.theme]);
  const pagesById = useMemo(() => new Map(book.pages.map((p) => [p.id, p])), [book.pages]);
  const factors = reduce ? FLAT : PARALLAX;
  const W = layout.width;
  const vu = vw / s;
  const maxScroll = Math.max(1, W * s - vw);

  const layers = useRef<Partial<Record<LayerName, HTMLDivElement | null>>>({});
  const timeline = useRef<TimelineHandle | null>(null);
  /** world x at the centre of the screen, kept across resizes */
  const centre = useRef<number | null>(null);

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

  const posOf = useCallback((cx: number) => Math.min(maxScroll, Math.max(0, cx * s - vw / 2)), [maxScroll, s, vw]);
  const goTo = useCallback(
    (cx: number, smooth: boolean) => stage?.scrollTo({ left: posOf(cx), behavior: smooth && !reduce ? "smooth" : "auto" }),
    [stage, posOf, reduce],
  );

  const update = useCallback(() => {
    if (!stage) return;
    const x = stage.scrollLeft;
    for (const k of ["sky", "mid", "front"] as const) {
      const el = layers.current[k];
      if (el) el.style.transform = `translate3d(${(x * (1 - factors[k])).toFixed(1)}px,0,0)`;
    }
    const cx = (x + vw / 2) / s;
    centre.current = cx;
    stage.style.backgroundColor = skyAt(layout, cx);
    timeline.current?.setProgress(x / maxScroll);
  }, [stage, factors, vw, s, layout, maxScroll]);

  // first placement (deep link) and keeping the same spot across resizes
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!stage || !ready) return;
    if (!placed.current) {
      placed.current = true;
      if (deepTarget) stage.scrollLeft = posOf(deepTarget.cx);
    } else if (centre.current !== null) {
      stage.scrollLeft = posOf(centre.current);
    }
    update();
  }, [stage, ready, s, vw, deepTarget, posOf, update]);

  useEffect(() => {
    if (!stage || !ready) return;
    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          update();
        });
    };
    // a mouse wheel scrolls the world sideways
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        stage.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    stage.addEventListener("scroll", onScroll, { passive: true });
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("scroll", onScroll);
      stage.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(raf);
    };
  }, [stage, ready, update]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!stage) return;
    const cx = (stage.scrollLeft + vw / 2) / s;
    if (e.key === "ArrowRight") {
      const next = layout.stops.find((st) => st.cx > cx + 20);
      goTo(next ? next.cx : W, true);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      const prev = [...layout.stops].reverse().find((st) => st.cx < cx - 20);
      goTo(prev ? prev.cx : 0, true);
      e.preventDefault();
    } else if (e.key === "Home") {
      goTo(0, true);
    } else if (e.key === "End") {
      goTo(W, true);
    }
  }

  const closeCover = useCallback(() => {
    sessionStorage.setItem(`ab-opened:${book.slug}`, "1");
    setCoverOpen(false);
    stage?.focus({ preventScroll: true });
  }, [book.slug, stage]);

  const marks = useMemo(
    () =>
      layout.stops.map((st) => ({
        p: maxScroll > 1 ? posOf(st.cx) / maxScroll : 0,
        label: st.monthShort,
        title: `Halaman ${st.index + 1}`,
      })),
    [layout.stops, posOf, maxScroll],
  );

  const firstSky = THEMES[layout.slices[0].theme].sky;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: firstSky }}>
      <WorldDefs />
      <div
        ref={setStage}
        tabIndex={0}
        role="region"
        aria-label={`${book.title} — geser untuk membaca`}
        onKeyDown={onKeyDown}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ backgroundColor: firstSky }}
      >
        {ready && (
          <div className="relative h-full" style={{ width: W * s, overflow: "clip" }}>
            {(["sky", "mid", "ground"] as const).map((l) => (
              <SceneryLayer
                key={l}
                layer={l}
                f={factors[l]}
                slices={layout.slices}
                seams={layout.seams}
                worldW={W}
                vu={vu}
                s={s}
                topU={topU}
                bottomU={bottomU}
                layerRef={(el) => {
                  layers.current[l] = el;
                }}
              />
            ))}
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 h-full"
              style={{ width: W * s, backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.34 }}
            />
            <div className="absolute left-0" style={{ top: bandTop, width: W * s, height: 720 * s, ["--u" as string]: `${s}px` } as React.CSSProperties}>
              <Items
                layout={layout}
                book={book}
                pagesById={pagesById}
                wishlistHref={`/book/${book.slug}/wishlist`}
                onCloseBook={() => setBackCover(true)}
              />
            </div>
            <SceneryLayer
              layer="front"
              f={factors.front}
              slices={layout.slices}
              seams={layout.seams}
              worldW={W}
              vu={vu}
              s={s}
              topU={topU}
              bottomU={bottomU}
              layerRef={(el) => {
                layers.current.front = el;
              }}
            />
          </div>
        )}
      </div>

      <TopChrome mapHref={`/book/${book.slug}/map`} wishlistHref={`/book/${book.slug}/wishlist`} shareTitle={book.title} />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex items-center gap-2 [&>*]:pointer-events-auto">
        <MusicButton />
        <Timeline ref={timeline} marks={marks} onSeek={(p, smooth) => stage?.scrollTo({ left: p * maxScroll, behavior: smooth && !reduce ? "smooth" : "auto" })} />
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
            goTo(0, false);
          }}
        />
      )}
    </div>
  );
}
