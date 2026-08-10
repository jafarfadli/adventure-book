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

// Binding seam. The book always renders as a spread pairing (1,2)(3,4)…, so
// odd indices sit on the left of a spread (seam on their right) and even
// ones on the right (seam on their left). Index 0 is the closed cover.
function gutterClass(index: number): string {
  if (index === 0) return "";
  return index % 2 === 1
    ? "border-r-2 border-black/20 shadow-[inset_-30px_0_30px_-26px_rgba(0,0,0,0.4)]"
    : "border-l-2 border-black/20 shadow-[inset_30px_0_30px_-26px_rgba(0,0,0,0.4)]";
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
      {/* Padding is a container query, not a viewport one, so the editor
          preview reproduces this page exactly at the same width. */}
      <div className={`@container h-full w-full overflow-hidden ${gutterClass(index)}`}>
        <div className="h-full w-full p-5 @md:p-8">
          {renderLayout(page, meta, theme)}
        </div>
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
    /**
     * Off when the reader pans a narrow viewport across the spread itself —
     * StPageFlip's own drag would fight those swipes. Read once at init, so
     * the reader remounts this component when the mode changes.
     */
    useMouseEvents?: boolean;
    onFlip: (pageIndex: number) => void;
  }
>(function FlipBook(
  { pages, meta, theme, startPage = 0, useMouseEvents = true, onFlip },
  ref,
) {
  const needsFiller = pages.length > 1 && pages.length % 2 === 0;

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
      // Always a two-page spread, even on phones — the reader pans across it
      // instead of collapsing the book to a single page.
      usePortrait={false}
      startZIndex={0}
      autoSize
      maxShadowOpacity={0.35}
      showCover
      mobileScrollSupport
      clickEventForward
      useMouseEvents={useMouseEvents}
      swipeDistance={30}
      showPageCorners={useMouseEvents}
      disableFlipByClick={false}
      onFlip={(e: { data: number }) => onFlip(e.data)}
    >
      {children}
    </HTMLFlipBook>
  );
});
