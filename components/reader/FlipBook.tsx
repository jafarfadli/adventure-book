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

// StPageFlip requires each page child to forward its DOM ref.
const FlipPage = forwardRef<
  HTMLDivElement,
  { page: PageData; meta: BookMeta; theme: Theme }
>(function FlipPage({ page, meta, theme }, ref) {
  return (
    <div ref={ref} className={`h-full w-full ${theme.paper}`}>
      <div className="@container paper-texture h-full w-full overflow-hidden p-6 md:p-8">
        {renderLayout(page, meta, theme)}
      </div>
    </div>
  );
});

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
      {pages.map((page) => (
        <FlipPage key={page.id} page={page} meta={meta} theme={theme} />
      ))}
    </HTMLFlipBook>
  );
});
