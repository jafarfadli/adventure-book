"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BookData } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { FlipBook, type FlipBookHandle } from "./FlipBook";
import { renderLayout } from "./layouts";
import { PageNav } from "./PageNav";
import { TocOverlay } from "./TocOverlay";

const SWIPE_THRESHOLD_PX = 48;

export default function BookReader({ book }: { book: BookData }) {
  const theme = getTheme(book.theme);
  const { pages } = book;
  const meta = { title: book.title, subtitle: book.subtitle };

  const [isSpread, setIsSpread] = useState(false);
  const [start, setStart] = useState(0);
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
        className={`flex min-h-dvh flex-1 items-center justify-center ${theme.backdrop}`}
      >
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
      className={`flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8 ${theme.backdrop}`}
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
      <div className="fixed top-4 right-4 z-30 flex items-center gap-4">
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
        <div className="w-full max-w-4xl">
          <FlipBook
            ref={flipRef}
            pages={pages}
            meta={meta}
            theme={theme}
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
            className="w-full max-w-5xl"
          >
            <div className="grid overflow-hidden rounded-sm shadow-2xl shadow-black/30 md:grid-cols-2">
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
