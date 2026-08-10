"use client";

import { forwardRef, useMemo } from "react";
import HTMLFlipBook from "react-pageflip";
import type { Theme } from "@/lib/themes";
import type { PageData } from "@/lib/types";
import { renderLayout, type BookMeta } from "./layouts";

export type PageFlipApi = {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (page: number) => void;
  getCurrentPageIndex: () => number;
};

export type FlipBookHandle = { pageFlip: () => PageFlipApi };

export type FlipOrientation = "portrait" | "landscape";

// Binding seam. Landscape (md+) pairs pages (1,2)(3,4)…, so odd indices sit
// on the left of a spread (seam right) and even ones on the right (seam
// left). Portrait shows one page at a time — the binding is always on the
// left. Expressed in CSS so orientation changes need no re-render.
function gutterClass(index: number): string {
  if (index === 0) return "";
  const seamLeft = "border-l border-black/10 shadow-[inset_28px_0_28px_-28px_rgba(0,0,0,0.25)]";
  if (index % 2 === 0) return seamLeft;
  return `${seamLeft} md:border-l-0 md:border-r md:border-black/10 md:shadow-[inset_-28px_0_28px_-28px_rgba(0,0,0,0.25)]`;
}

// StPageFlip requires each page child to forward its DOM ref.
const FlipPage = forwardRef<
  HTMLDivElement,
  { page: PageData; index: number; meta: BookMeta; theme: Theme }
>(function FlipPage({ page, index, meta, theme }, ref) {
  const surface =
    page.layout === "COVER" ? "bg-[#ff97d0]" : `paper-texture ${theme.paper}`;
  return (
    <div ref={ref} className={`h-full w-full ${surface}`}>
      <div
        className={`@container h-full w-full overflow-hidden p-5 md:p-8 ${gutterClass(index)}`}
      >
        {renderLayout(page, meta, theme)}
      </div>
    </div>
  );
});

// Blank right-hand page that pairs with the final page of an even-length
// book, so the last landscape view is a full spread instead of a lone page.
const FillerPage = forwardRef<HTMLDivElement, { index: number; theme: Theme }>(
  function FillerPage({ index, theme }, ref) {
    return (
      <div ref={ref} className={`h-full w-full paper-texture ${theme.paper}`}>
        <div
          className={`flex h-full w-full items-end justify-center pb-10 ${gutterClass(index)}`}
        >
          <span className="font-hand text-2xl text-stone-400/60">♡</span>
        </div>
      </div>
    );
  },
);

export const FlipBook = forwardRef<
  FlipBookHandle,
  {
    pages: PageData[];
    meta: BookMeta;
    theme: Theme;
    startPage?: number;
    /** Landscape-only trailing blank page (see FillerPage). */
    withFiller?: boolean;
    onFlip: (pageIndex: number) => void;
    onOrientation?: (orientation: FlipOrientation) => void;
  }
>(function FlipBook(
  { pages, meta, theme, startPage = 0, withFiller = false, onFlip, onOrientation },
  ref,
) {
  const needsFiller = withFiller && pages.length > 1 && pages.length % 2 === 0;

  // Children identity must stay stable across unrelated parent re-renders.
  // react-pageflip clears its collected page refs whenever `children` change
  // identity, but with renderOnlyPageLengthChange it skips re-rendering them
  // (so the refs never come back) — a re-render landing between mount and
  // init would otherwise leave the book permanently uninitialized.
  const children = useMemo(
    () => [
      ...pages.map((page, i) => (
        <FlipPage key={page.id} page={page} index={i} meta={meta} theme={theme} />
      )),
      ...(needsFiller
        ? [<FillerPage key="filler" index={pages.length} theme={theme} />]
        : []),
    ],
    [pages, meta, theme, needsFiller],
  );

  return (
    <HTMLFlipBook
      ref={ref}
      className="mx-auto"
      style={{}}
      startPage={startPage}
      renderOnlyPageLengthChange
      size="stretch"
      width={460}
      height={620}
      minWidth={260}
      maxWidth={560}
      minHeight={360}
      maxHeight={760}
      drawShadow
      flippingTime={700}
      // Narrow viewports get single-page mode — still a real 3D page turn,
      // just one page at a time, which suits a phone far better than a spread.
      usePortrait
      startZIndex={0}
      autoSize
      maxShadowOpacity={0.35}
      showCover
      mobileScrollSupport
      clickEventForward
      useMouseEvents
      swipeDistance={30}
      showPageCorners
      disableFlipByClick={false}
      onFlip={(e: { data: number }) => onFlip(e.data)}
      // onChangeOrientation only fires on later changes, so seed the initial
      // orientation from onInit's book state.
      onInit={(e: { data: { mode: FlipOrientation } }) => onOrientation?.(e.data.mode)}
      onChangeOrientation={(e: { data: FlipOrientation }) => onOrientation?.(e.data)}
    >
      {children}
    </HTMLFlipBook>
  );
});
