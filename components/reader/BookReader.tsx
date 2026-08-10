"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BookData } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { renderLayout } from "./layouts";
import { PageNav } from "./PageNav";

const SWIPE_THRESHOLD_PX = 48;

export default function BookReader({ book }: { book: BookData }) {
  const theme = getTheme(book.theme);
  const { pages } = book;

  const [isSpread, setIsSpread] = useState(false);
  const [start, setStart] = useState(0);
  const [dir, setDir] = useState(1);
  const reducedMotion = useReducedMotion();
  const touchX = useRef<number | null>(null);

  const perView = isSpread ? 2 : 1;

  // Two-page spread on md+, single stacked page below.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      setIsSpread(mq.matches);
      // Keep spreads aligned to even page indices.
      if (mq.matches) setStart((s) => s - (s % 2));
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const next = useCallback(() => {
    setDir(1);
    setStart((s) => (s + perView >= pages.length ? s : s + perView));
  }, [perView, pages.length]);

  const prev = useCallback(() => {
    setDir(-1);
    setStart((s) => Math.max(0, s - perView));
  }, [perView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (pages.length === 0) {
    return (
      <main
        className={`flex min-h-dvh flex-1 items-center justify-center ${theme.backdrop}`}
      >
        <p className={`font-hand text-3xl ${theme.ink}`}>Belum ada halaman di buku ini.</p>
      </main>
    );
  }

  const visible = pages.slice(start, start + perView);
  const canPrev = start > 0;
  const canNext = start + perView < pages.length;
  const label =
    isSpread && visible.length === 2
      ? `hal. ${start + 1}–${start + 2} / ${pages.length}`
      : `hal. ${start + 1} / ${pages.length}`;
  const duration = reducedMotion ? 0 : 0.35;
  const gutterLeft = "md:shadow-[inset_-28px_0_28px_-28px_rgba(0,0,0,0.35)]";
  const gutterRight = "md:shadow-[inset_28px_0_28px_-28px_rgba(0,0,0,0.35)]";

  return (
    <main
      className={`flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8 ${theme.backdrop}`}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (dx < 0) next();
        else prev();
      }}
    >
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
                className={`relative min-h-[70dvh] p-6 md:p-10 ${theme.paper} ${
                  isSpread ? (i === 0 ? gutterLeft : gutterRight) : ""
                }`}
              >
                {renderLayout(page, { title: book.title, subtitle: book.subtitle }, theme)}
              </section>
            ))}
            {isSpread && visible.length === 1 && (
              <div aria-hidden className={`hidden md:block ${theme.paper} ${gutterRight}`} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
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
    </main>
  );
}
