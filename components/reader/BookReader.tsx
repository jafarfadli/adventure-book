"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconMapPin, IconPencil, IconShare, IconSparkle } from "@/components/ui/icons";
import type { BookData } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { CuteBackdrop } from "./CuteBackdrop";
import { FlipBook, type FlipBookHandle } from "./FlipBook";
import { MusicToggle } from "./MusicToggle";
import { renderLayout } from "./layouts";
import { PageNav } from "./PageNav";

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
  // Stable identity: FlipBook memoizes its children on this (see FlipBook).
  const meta = useMemo(
    () => ({ title: book.title, subtitle: book.subtitle }),
    [book.title, book.subtitle],
  );

  const [isSpread, setIsSpread] = useState(false);
  // Which page of the open spread the narrow-screen camera is looking at:
  // 0 = left, 1 = right. The closed cover sits on the right half.
  const [half, setHalf] = useState<0 | 1>(1);
  const [start, setStart] = useState(initialPage);
  const [dir, setDir] = useState(1);
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchX = useRef<number | null>(null);
  const flipRef = useRef<FlipBookHandle | null>(null);

  // Real 3D page-flip everywhere — StPageFlip switches to single-page
  // (portrait) on narrow screens by itself. Only reduced motion falls back
  // to the fade-slide reader, and that swap waits for mount: the server
  // can't know the preference, so deciding during render would desync
  // hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const flipMode = mounted ? !reducedMotion : true;
  // Narrow screens keep the two-page spread but only show one page at a
  // time, panning the book sideways instead of shrinking it.
  const cameraMode = flipMode && !isSpread;
  const perView = isSpread && !flipMode ? 2 : 1;

  // The book pairs pages (1,2)(3,4)…, so only 0 and odd indices are valid
  // view starts. Normalizing with the wrong grid corrupts deep links.
  const toFlipIndex = useCallback(
    (i: number) => (i === 0 ? 0 : i % 2 === 1 ? i : i - 1),
    [],
  );
  const flipInitial = toFlipIndex(initialPage);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsSpread(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Re-align the current position whenever the active grid changes.
  useEffect(() => {
    if (flipMode) setStart((s) => toFlipIndex(s));
    else setStart((s) => (isSpread ? s - (s % 2) : s));
  }, [flipMode, isSpread, toFlipIndex]);

  // Follow ?page= even when this instance is reused (e.g. a map pin pushes a
  // new search param onto the same route). Runs after FlipBook's own init, so
  // it also overrides react-pageflip's occasionally-off initial onFlip value.
  const prevInitialPage = useRef(initialPage);
  useEffect(() => {
    const changed = prevInitialPage.current !== initialPage;
    prevInitialPage.current = initialPage;
    if (flipMode) {
      setStart(flipInitial);
      if (changed) {
        // pageFlip() is undefined until StPageFlip finishes initializing;
        // on first mount startPage already positions the book.
        try {
          flipRef.current?.pageFlip()?.turnToPage(flipInitial);
        } catch {
          // not ready yet — startPage/state already point at the target
        }
      }
    } else {
      setStart(isSpread ? initialPage - (initialPage % 2) : initialPage);
    }
    setHalf(initialPage === 0 ? 1 : initialPage % 2 === 1 ? 0 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage, flipMode]);

  const next = useCallback(() => {
    if (flipMode) {
      // Panning across the open spread costs no page turn: only crossing to
      // the next spread actually flips paper.
      if (cameraMode && start > 0 && half === 0 && start + 1 < pages.length) {
        setHalf(1);
        return;
      }
      if (cameraMode) setHalf(0);
      flipRef.current?.pageFlip()?.flipNext();
      return;
    }
    setDir(1);
    setStart((s) => (s + perView >= pages.length ? s : s + perView));
  }, [flipMode, cameraMode, start, half, perView, pages.length]);

  const prev = useCallback(() => {
    if (flipMode) {
      if (cameraMode && half === 1 && start > 0) {
        setHalf(0);
        return;
      }
      // Flipping back lands on the previous spread's right-hand page (and
      // the closed cover also sits on the right half).
      if (cameraMode) setHalf(1);
      flipRef.current?.pageFlip()?.flipPrev();
      return;
    }
    setDir(-1);
    setStart((s) => Math.max(0, s - perView));
  }, [flipMode, cameraMode, half, start, perView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

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

  // Index of the page the camera is actually on (narrow screens only).
  const camIndex = start === 0 ? 0 : start + half;
  const canPrev = start > 0;
  const canNext = !flipMode
    ? start + perView < pages.length
    : cameraMode
      ? camIndex + 1 < pages.length
      : start === 0
        ? pages.length > 1
        : start + 2 < pages.length;
  const visible = pages.slice(start, start + perView);
  // Narrow-screen camera geometry. A page is deliberately narrower than the
  // screen: CAM_RIM of pink cover shows on the bound side, CAM_PEEK of the
  // facing page bleeds off the other edge, so the book always reads as an
  // open spread continuing past the viewport rather than a lone sheet.
  // A page is `100vw - CAM_SPAN` wide, so the spread is `200vw - 2*CAM_SPAN`
  // and shifting it by these offsets lands the wanted page in view.
  const CAM_RIM = 14;
  const CAM_PEEK = 40;
  const CAM_SPAN = CAM_RIM + CAM_PEEK;
  // The closed cover is its own thing: a book seen shut, framed on all four
  // sides. `half` flips the instant a turn starts, so the framing swaps
  // under the motion instead of popping when the animation lands.
  const isCoverView = start === 0 && half === 1;
  const camTransform =
    isCoverView
      ? `translateX(calc(${CAM_SPAN / 2 + CAM_SPAN}px - 100vw))`
      : half === 0
        ? // left page: pink rim at the left, facing page bleeds off the right
          `translateX(${CAM_RIM}px)`
        : // right page: facing page bleeds off the left, pink rim at the right
          `translateX(calc(${CAM_PEEK + CAM_SPAN}px - 100vw))`;

  const spreadLabel = `hal. ${start + 1}–${start + 2} / ${pages.length}`;
  const label = cameraMode
    ? `hal. ${camIndex + 1} / ${pages.length}`
    : flipMode
      ? start > 0 && start + 1 < pages.length
        ? spreadLabel
        : `hal. ${start + 1} / ${pages.length}`
      : isSpread && visible.length === 2
        ? spreadLabel
        : `hal. ${start + 1} / ${pages.length}`;
  const duration = reducedMotion ? 0 : 0.35;
  const gutterLeft = "md:shadow-[inset_-28px_0_28px_-28px_rgba(0,0,0,0.35)]";
  const gutterRight = "md:shadow-[inset_28px_0_28px_-28px_rgba(0,0,0,0.35)]";

  return (
    <main
      className={`relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 pt-16 pb-4 md:px-8 md:pt-20 md:pb-8 ${theme.backdrop}`}
      onTouchStart={(e) => {
        // In camera mode StPageFlip's own drag is off, so swipes are ours.
        if (flipMode && !cameraMode) return;
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if ((flipMode && !cameraMode) || touchX.current === null) return;
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
          className={`inline-flex items-center gap-1.5 font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
          aria-label="Buka peta kenangan"
        >
          <IconMapPin className="h-4 w-4" /> peta
        </Link>
        <Link
          href={`/book/${book.slug}/wishlist`}
          className={`inline-flex items-center gap-1.5 font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
          aria-label="Buka wishlist"
        >
          <IconSparkle className="h-4 w-4" /> wishlist
        </Link>
        <button
          type="button"
          onClick={share}
          aria-label="Bagikan buku ini"
          className={`inline-flex items-center gap-1.5 font-hand text-lg opacity-50 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
        >
          <IconShare className="h-4 w-4" /> {copied ? "tersalin ✓" : "bagikan"}
        </button>
      </div>

      {flipMode ? (
        <div className="relative w-full max-w-4xl">
          {/* Book cover peeking out around the pages + the paper block edge
              at the bottom. On the cover/closing views the book occupies one
              half only, so the chrome follows the open half. */}
          {!cameraMode && (
            <>
              <div
                aria-hidden
                className={`absolute -top-2.5 -bottom-4 rounded-md bg-gradient-to-br from-[#ffb3dd] via-[#ff97d0] to-[#f277b8] shadow-2xl shadow-black/40 ${
                  start === 0 ? "left-1/2 -right-3" : "-inset-x-3"
                }`}
              />
              <div
                aria-hidden
                className={`absolute -bottom-2.5 h-3 bg-[repeating-linear-gradient(to_bottom,#fdfaf1_0_2px,#cfc6b0_2px_3px)] ${
                  start === 0 ? "left-[51%] right-0" : "inset-x-0"
                }`}
              />
            </>
          )}
          {cameraMode ? (
            <>
              {/* Shut-book frame, cover only. Sits outside the camera's
                  clipping box so its drop shadow survives; the centred
                  cover leaves an even pink border inside it. */}
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 -top-px bottom-0 rounded-md bg-gradient-to-br from-[#ffb3dd] via-[#ff97d0] to-[#f277b8] shadow-2xl shadow-black/40 transition-opacity duration-500 ${
                  isCoverView ? "opacity-100" : "opacity-0"
                }`}
              />
              {/* Full-bleed window onto a book wider than the screen. The
                  pink is the cover surface *behind* the paper, so it only
                  shows on the bound side — the other side is the spread
                  running on past the viewport. */}
              <div className="relative -mx-4 overflow-hidden pt-2.5 pb-5">
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br from-[#ffb3dd] via-[#ff97d0] to-[#f277b8] shadow-2xl shadow-black/40 transition-opacity duration-500 ${
                    isCoverView ? "opacity-0" : "opacity-100"
                  }`}
                />
                <div
                  className="relative w-[calc(200vw-108px)] transition-transform duration-[650ms] ease-in-out"
                  style={{ transform: camTransform }}
                >
                  {/* Edge of the page block. It belongs to the book, so it
                      lives inside the panned element and shares its exact
                      transform — anchoring it to the viewport instead made
                      it drift against the pages while swiping. Spans the
                      whole spread; under the shut cover, only its half. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-3 right-0 h-3 bg-[repeating-linear-gradient(to_bottom,#fdfaf1_0_2px,#cfc6b0_2px_3px)] transition-[left] duration-[650ms] ease-in-out"
                    style={{ left: isCoverView ? "calc(100vw - 54px)" : 0 }}
                  />
                  <FlipBook
                    key="camera"
                    ref={flipRef}
                    pages={pages}
                    meta={meta}
                    theme={theme}
                    startPage={flipInitial}
                    useMouseEvents={false}
                    onFlip={setStart}
                  />
                </div>
              </div>
            </>
          ) : (
            <FlipBook
              key="full"
              ref={flipRef}
              pages={pages}
              meta={meta}
              theme={theme}
              startPage={flipInitial}
              onFlip={setStart}
            />
          )}
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
            {/* notebook cover peeking around the page + paper block edge */}
            <div
              aria-hidden
              className="absolute -inset-x-2 -top-2 -bottom-3.5 rounded-md bg-gradient-to-br from-[#ffb3dd] via-[#ff97d0] to-[#f277b8] shadow-2xl shadow-black/40"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 -bottom-2 h-3 bg-[repeating-linear-gradient(to_bottom,#fdfaf1_0_2px,#cfc6b0_2px_3px)]"
            />
            <div className="relative grid overflow-hidden rounded-sm shadow-2xl shadow-black/30 md:grid-cols-2">
              {visible.map((page, i) => (
                <section
                  key={page.id}
                  aria-label={`Halaman ${page.order + 1}`}
                  className={`@container relative min-h-[70dvh] p-6 md:p-10 ${
                    page.layout === "COVER"
                      ? "bg-[#ff97d0]"
                      : `paper-texture ${theme.paper}`
                  } ${isSpread ? (i === 0 ? gutterLeft : gutterRight) : ""}`}
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
      <MusicToggle className={`fixed bottom-4 left-4 z-30 ${theme.inkSoft}`} />
      <Link
        href={`/book/${book.slug}/unlock`}
        className={`fixed right-4 bottom-4 inline-flex items-center gap-1.5 font-hand text-lg opacity-40 transition hover:opacity-100 focus-visible:opacity-100 ${theme.inkSoft}`}
        aria-label="Buka mode edit"
      >
        <IconPencil className="h-4 w-4" /> edit
      </Link>
    </main>
  );
}
