"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BookData } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { CuteBackdrop } from "./CuteBackdrop";
import { FlipBook, type FlipBookHandle } from "./FlipBook";
import { renderLayout } from "./layouts";
import { PageNav } from "./PageNav";
import { TocOverlay } from "./TocOverlay";

const SWIPE_THRESHOLD_PX = 48;

export default function BookReader({
  book,
  initialPage = 0,
}: {
  book: BookData;
  initialPage?: number;
}) {
  const theme = getTheme(book.theme);
  const { pages } = book;
  const meta = { title: book.title, subtitle: book.subtitle };

  const [isSpread, setIsSpread] = useState(false);
  const [start, setStart] = useState(initialPage);
  const [dir, setDir] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchX = useRef<number | null>(null);
  const flipRef = useRef<FlipBookHandle | null>(null);

  // 3D page-flip on md+; fall back to fade-slide when motion is reduced.
  const flipMode = isSpread && !reducedMotion;
  const perView = isSpread ? 2 : 1;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setIsSpread(mq.matches);
      // Keep spreads aligned to even page indices (fade-slide mode).
      if (mq.matches) setStart((s) => s - (s % 2));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const next = useCallback(() => {
    if (flipMode) {
      flipRef.current?.pageFlip().flipNext();
      return;
    }
    setDir(1);
    setStart((s) => (s + perView >= pages.length ? s : s + perView));
  }, [flipMode, perView, pages.length]);

  const prev = useCallback(() => {
    if (flipMode) {
      flipRef.current?.pageFlip().flipPrev();
      return;
    }
    setDir(-1);
    setStart((s) => Math.max(0, s - perView));
  }, [flipMode, perView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTocOpen(false);
      if (tocOpen) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, tocOpen]);

  const jumpTo = useCallback(
    (i: number) => {
      setTocOpen(false);
      if (flipMode) {
        flipRef.current?.pageFlip().turnToPage(i);
        return;
      }
      setDir(i >= start ? 1 : -1);
      setStart(isSpread ? i - (i % 2) : i);
    },
    [flipMode, isSpread, start],
  );

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  if (pages.length === 0) {
    return (
      <main
        className={`relative flex min-h-dvh flex-1 items-center justify-center ${theme.backdrop}`}
      >
        <CuteBackdrop />
        <p className={`font-hand text-3xl ${theme.ink}`}>Belum ada halaman di buku ini.</p>
      </main>
    );
  }

  const canPrev = start > 0;
  const canNext = flipMode
    ? start < pages.length - 1
    : start + perView < pages.length;
  const visible = pages.slice(start, start + perView);
  const label =
    !flipMode && isSpread && visible.length === 2
      ? `hal. ${start + 1}–${start + 2} / ${pages.length}`
      : `hal. ${start + 1} / ${pages.length}`;
  const duration = reducedMotion ? 0 : 0.35;
  const gutterLeft = "md:shadow-[inset_-28px_0_28px_-28px_rgba(0,0,0,0.35)]";
  const gutterRight = "md:shadow-[inset_28px_0_28px_-28px_rgba(0,0,0,0.35)]";

  return (
    <main
      className={`relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-4 md:p-8 ${theme.backdrop}`}
      onTouchStart={(e) => {
        if (flipMode) return;
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (flipMode || touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (dx < 0) next();
        else prev();
      }}
    >
      <CuteBackdrop />

      <div className="fixed top-4 left-4 z-30 hidden -rotate-2 md:block">
        <span className="relative rounded-sm bg-white/75 px-4 py-1 font-hand text-2xl text-stone-700 shadow-sm">
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 h-4 w-16 -translate-x-1/2 -rotate-3 bg-amber-200/80"
          />
          {book.title} ♡
        </span>
      </div>

      <div className="fixed top-4 right-4 z-30 flex items-center gap-4">
        <Link
          href={`/book/${book.slug}/map`}
          className={`font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
          aria-label="Buka peta kenangan"
        >
          🗺️ peta
        </Link>
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          aria-label="Buka daftar isi"
          className={`font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
        >
          ☰ daftar isi
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Bagikan buku ini"
          className={`font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
        >
          {copied ? "Tersalin ✓" : "↗ bagikan"}
        </button>
      </div>

      {flipMode ? (
        <div className="relative w-full max-w-4xl">
          {/* page stack peeking under the book — makes it read as a real book.
              On the cover (and closing) page the book occupies one half only,
              so the stack follows it. */}
          <div
            aria-hidden
            className={`absolute -bottom-2.5 h-8 rounded-b-xl bg-white/85 shadow-lg ${
              start === 0
                ? "left-1/2 right-6 ml-6"
                : start >= pages.length - 1
                  ? "left-6 right-1/2 mr-6"
                  : "inset-x-10"
            }`}
          />
          <div
            aria-hidden
            className={`absolute -bottom-5 h-8 rounded-b-xl bg-white/60 shadow-md ${
              start === 0
                ? "left-1/2 right-10 ml-10"
                : start >= pages.length - 1
                  ? "left-10 right-1/2 mr-10"
                  : "inset-x-16"
            }`}
          />
          <FlipBook
            ref={flipRef}
            pages={pages}
            meta={meta}
            theme={theme}
            startPage={initialPage}
            onFlip={setStart}
          />
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${start}-${isSpread}`}
            initial={{ opacity: 0, x: 40 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * dir }}
            transition={{ duration, ease: "easeOut" }}
            className="relative w-full max-w-5xl"
          >
            {/* stacked-paper layers behind the page, scrapbook style */}
            <div
              aria-hidden
              className="absolute -inset-1 -rotate-1 rounded-sm bg-white/70 shadow-xl"
            />
            <div
              aria-hidden
              className="absolute -inset-1 rotate-1 rounded-sm bg-white/50 shadow-lg"
            />
            <div className="relative grid overflow-hidden rounded-sm shadow-2xl shadow-black/30 md:grid-cols-2">
              {visible.map((page, i) => (
                <section
                  key={page.id}
                  aria-label={`Halaman ${page.order + 1}`}
                  className={`@container relative min-h-[70dvh] p-6 md:p-10 ${theme.paper} ${
                    isSpread ? (i === 0 ? gutterLeft : gutterRight) : ""
                  }`}
                >
                  {renderLayout(page, meta, theme)}
                </section>
              ))}
              {isSpread && visible.length === 1 && (
                <div aria-hidden className={`hidden md:block ${theme.paper} ${gutterRight}`} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <PageNav
        label={label}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={prev}
        onNext={next}
        theme={theme}
      />
      <Link
        href={`/book/${book.slug}/unlock`}
        className={`fixed right-4 bottom-4 font-hand text-lg opacity-40 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
        aria-label="Buka mode edit"
      >
        ✎ edit
      </Link>
      {tocOpen && (
        <TocOverlay
          pages={pages}
          currentIndex={start}
          onJump={jumpTo}
          onClose={() => setTocOpen(false)}
        />
      )}
    </main>
  );
}
