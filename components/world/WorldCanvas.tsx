"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { worldScale } from "@/lib/v2/scale";
import { THEMES } from "@/lib/v2/themes";
import type { BookV2, PageV2 } from "@/lib/v2/types";
import { skyAt, type WorldLayout } from "@/lib/v2/world";
import { GRAIN_URL, WorldDefs } from "./art/defs";
import { useReducedMotion, useSize } from "./hooks";
import { Items, type StationHooks } from "./Items";
import { SceneryLayer, type LayerName } from "./Scenery";

const PARALLAX: Record<LayerName, number> = { sky: 0.22, mid: 0.55, ground: 1, front: 1.16 };
const FLAT: Record<LayerName, number> = { sky: 1, mid: 1, ground: 1, front: 1 };

export type WorldCanvasHandle = {
  /** scroll so world x is centred */
  goTo: (x: number, smooth: boolean) => void;
  /** progress 0..1 along the scrollable width */
  seek: (p: number, smooth: boolean) => void;
  /** world x at the centre of the screen */
  centre: () => number;
  stage: () => HTMLDivElement | null;
  scale: () => number;
};

/**
 * The world itself — scroll stage, parallax scenery, stops and signs — shared
 * by the reader and the editor, which only add their own chrome and overlays.
 * One rAF-throttled scroll handler moves the layers and tints the sky; it
 * never triggers a React render.
 */
export const WorldCanvas = forwardRef<
  WorldCanvasHandle,
  {
    book: BookV2;
    layout: WorldLayout;
    /** world x to centre on first layout (deep links), or null for the start */
    initialX?: number | null;
    onProgress?: (p: number) => void;
    /** called when the scale or viewport changes (not per frame) */
    onMetrics?: (m: { s: number; vw: number; maxScroll: number }) => void;
    onKeyDown?: (e: React.KeyboardEvent, api: WorldCanvasHandle) => void;
    wishlistHref: string;
    onCloseBook?: () => void;
    /** editor hooks: overlays inside the items layer, per-stop props */
    overlay?: (ctx: { s: number }) => React.ReactNode;
    station?: (page: PageV2) => StationHooks | undefined;
    onItemsPointer?: (e: React.MouseEvent<HTMLDivElement>) => void;
    label: string;
  }
>(function WorldCanvas(
  { book, layout, initialX = null, onProgress, onMetrics, onKeyDown, wishlistHref, onCloseBook, overlay, station, onItemsPointer, label },
  ref,
) {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { w: vw, h: vh } = useSize(stage);
  const reduce = useReducedMotion();
  const ready = vw > 0 && vh > 0;
  const { s, bandTop, topU, bottomU } = worldScale(vw || 1, vh || 1);
  const pagesById = useMemo(() => new Map(book.pages.map((p) => [p.id, p])), [book.pages]);
  const factors = reduce ? FLAT : PARALLAX;
  const W = layout.width;
  const vu = vw / s;
  const maxScroll = Math.max(1, W * s - vw);

  const layers = useRef<Partial<Record<LayerName, HTMLDivElement | null>>>({});
  const centre = useRef<number | null>(null);
  const progress = useRef(onProgress);
  progress.current = onProgress;

  const posOf = useCallback((cx: number) => Math.min(maxScroll, Math.max(0, cx * s - vw / 2)), [maxScroll, s, vw]);

  const api = useMemo<WorldCanvasHandle>(
    () => ({
      goTo: (x, smooth) => stage?.scrollTo({ left: posOf(x), behavior: smooth && !reduce ? "smooth" : "auto" }),
      seek: (p, smooth) => stage?.scrollTo({ left: p * maxScroll, behavior: smooth && !reduce ? "smooth" : "auto" }),
      centre: () => (stage ? (stage.scrollLeft + vw / 2) / s : 0),
      stage: () => stage,
      scale: () => s,
    }),
    [stage, posOf, reduce, maxScroll, vw, s],
  );
  useImperativeHandle(ref, () => api, [api]);

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
    progress.current?.(x / maxScroll);
  }, [stage, factors, vw, s, layout, maxScroll]);

  // first placement and keeping the same spot across resizes / edits
  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!stage || !ready) return;
    if (!placed.current) {
      placed.current = true;
      if (initialX !== null) stage.scrollLeft = posOf(initialX);
    } else if (centre.current !== null) {
      stage.scrollLeft = posOf(centre.current);
    }
    update();
  }, [stage, ready, s, vw, W, initialX, posOf, update]);

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

  useEffect(() => {
    if (ready) onMetrics?.({ s, vw, maxScroll });
  }, [ready, s, vw, maxScroll, onMetrics]);

  const firstSky = THEMES[layout.slices[0].theme].sky;

  return (
    <>
      <WorldDefs />
      <div
        ref={setStage}
        tabIndex={0}
        role="region"
        aria-label={label}
        onKeyDown={(e) => onKeyDown?.(e, api)}
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
            <div
              className="absolute left-0"
              onClick={onItemsPointer}
              style={{ top: bandTop, width: W * s, height: 720 * s, ["--u" as string]: `${s}px` } as React.CSSProperties}
            >
              <Items layout={layout} book={book} pagesById={pagesById} wishlistHref={wishlistHref} onCloseBook={onCloseBook} station={station} />
              {overlay?.({ s })}
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
    </>
  );
});
