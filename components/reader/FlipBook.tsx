"use client";

import { forwardRef } from "react";
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

// Center-gutter seam: with showCover, odd indices sit on the left of a
// spread (seam on their right), even indices on the right (seam on their
// left). Index 0 is the closed cover — no seam.
function gutterClass(index: number): string {
  if (index === 0) return "";
  return index % 2 === 1
    ? "border-r border-black/10 shadow-[inset_-28px_0_28px_-28px_rgba(0,0,0,0.25)]"
    : "border-l border-black/10 shadow-[inset_28px_0_28px_-28px_rgba(0,0,0,0.25)]";
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
        className={`@container h-full w-full overflow-hidden p-6 md:p-8 ${gutterClass(index)}`}
      >
        {renderLayout(page, meta, theme)}
      </div>
    </div>
  );
});

// Blank right-hand page that pairs with the final page of an even-length
// book, so the last view is a full spread instead of a lone page.
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
    onFlip: (pageIndex: number) => void;
  }
>(function FlipBook({ pages, meta, theme, startPage = 0, onFlip }, ref) {
  const needsFiller = pages.length > 1 && pages.length % 2 === 0;
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
      minWidth={280}
      maxWidth={560}
      minHeight={380}
      maxHeight={760}
      drawShadow
      flippingTime={700}
      usePortrait={false}
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
    >
      {[
        ...pages.map((page, i) => (
          <FlipPage key={page.id} page={page} index={i} meta={meta} theme={theme} />
        )),
        ...(needsFiller
          ? [<FillerPage key="filler" index={pages.length} theme={theme} />]
          : []),
      ]}
    </HTMLFlipBook>
  );
});
