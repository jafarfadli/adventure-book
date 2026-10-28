"use client";

import Link from "next/link";
import { memo } from "react";
import { Icon, IconButton } from "@/components/v2/Icon";
import { longDate, stampParts } from "@/lib/v2/dates";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";
import type { BookV2, PageV2 } from "@/lib/v2/types";
import type { Segment, WorldLayout } from "@/lib/v2/world";
import { CARD_SHADOW, u } from "./items/units";
import { Station, type StationEdit } from "./Station";

/** Per-stop editor props (undefined in the reader). */
export type StationHooks = StationEdit;

// Everything that sits on the path at scroll speed: the stops themselves and
// the book's own signs — the start board (bookplate), month signposts and the
// end (bersambung, stats, next adventures from the wishlist).

const vars = (t: ThemeKey) => themeCssVars(THEMES[t]) as React.CSSProperties;

function Post({ left, top, height }: { left: string; top: number; height: number }) {
  return (
    <span
      aria-hidden
      className="absolute"
      style={{ left, top: u(top), width: u(12), height: u(height), marginLeft: u(-6), background: "var(--c4)", borderRadius: u(3) }}
    />
  );
}

function Board({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative text-center ${className}`}
      style={{ background: "#fffaf2", borderRadius: u(12), boxShadow: CARD_SHADOW, padding: `${u(16)} ${u(18)}`, ...style }}
    >
      {children}
    </div>
  );
}

function StartSign({ seg, book }: { seg: Segment; book: BookV2 }) {
  const first = book.stats.first ? new Date(book.stats.first) : null;
  return (
    <div className="absolute" style={{ left: u(seg.x + 40), top: u(170), width: u(340), ...vars(seg.theme) }}>
      <Post left="22%" top={120} height={310} />
      <Post left="78%" top={120} height={310} />
      <Board style={{ transform: "rotate(-1.5deg)" }}>
        <span className="block font-hand-alt" style={{ fontSize: u(17), color: "var(--c3)" }}>
          Buku ini milik
        </span>
        <span className="block font-hand font-bold" style={{ fontSize: u(50), lineHeight: 1.05, color: "var(--c4)" }}>
          {book.title}
        </span>
        <span className="mt-[0.4em] block font-hand-alt" style={{ fontSize: u(15), color: "var(--c3)" }}>
          vol. {book.volume}
          {first ? ` · dimulai ${longDate(first)}` : ""}
        </span>
        <span className="mt-[0.5em] inline-block animate-[ab-nudge_1.6s_ease-in-out_infinite] motion-reduce:animate-none" style={{ color: "var(--c3)" }}>
          <Icon name="arrow-right" className="h-[1.6em] w-[1.6em]" />
        </span>
      </Board>
    </div>
  );
}

function MonthSign({ seg }: { seg: Segment & { kind: "sign" } }) {
  return (
    <div className="absolute" style={{ left: u(seg.x + 5), top: u(452), width: u(170), ...vars(seg.theme) }}>
      <Post left="50%" top={30} height={130} />
      <Board className="flex items-center justify-center gap-[0.3em]" style={{ padding: `${u(10)} ${u(12)}`, transform: "rotate(-2deg)" }}>
        <span className="font-hand font-bold" style={{ fontSize: u(25), lineHeight: 1.1, color: "var(--c4)" }}>
          {seg.label}
        </span>
        <Icon name="arrow-right" className="h-[1.1em] w-[1.1em] shrink-0" />
      </Board>
    </div>
  );
}

function range(first: string | null, last: string | null): string | null {
  if (!first || !last) return null;
  const a = stampParts(new Date(first));
  const b = stampParts(new Date(last));
  return a.year === b.year ? `${a.day} – ${b.day} ${b.year}` : `${a.day} ${a.year} – ${b.day} ${b.year}`;
}

function EndSegment({
  seg,
  book,
  wishlistHref,
  onClose,
}: {
  seg: Segment;
  book: BookV2;
  wishlistHref: string;
  onClose?: () => void;
}) {
  const when = range(book.stats.first, book.stats.last);
  return (
    <div className="absolute" style={{ left: u(seg.x), top: 0, width: u(seg.w), height: u(720), ...vars(seg.theme) }}>
      <div className="absolute" style={{ left: u(30), top: u(230), width: u(330) }}>
        <Post left="22%" top={150} height={240} />
        <Post left="78%" top={150} height={240} />
        <Board style={{ transform: "rotate(1deg)" }}>
          <span className="block font-hand font-bold" style={{ fontSize: u(42), lineHeight: 1.1, color: "var(--c4)" }}>
            ~ bersambung ~
          </span>
          {book.closingText && (
            <span className="mt-[0.2em] block font-hand font-bold" style={{ fontSize: u(26), color: "var(--ink)" }}>
              {book.closingText}
            </span>
          )}
          <span className="mt-[0.5em] block font-hand-alt" style={{ fontSize: u(15), color: "var(--c3)" }}>
            {book.stats.stops} halaman · {book.stats.media} kenangan
            {when ? <br /> : null}
            {when}
          </span>
          {onClose && (
            <span className="absolute" style={{ right: u(-16), bottom: u(-16) }}>
              <IconButton icon="book" label="Tutup buku" onClick={onClose} size="sm" variant="primary" />
            </span>
          )}
        </Board>
      </div>

      {book.wishlistTop.length > 0 && (
        <span className="absolute" style={{ left: u(430), top: u(360), color: "var(--accent)" }} aria-hidden>
          <Icon name="spark" className="h-[2.2em] w-[2.2em]" />
        </span>
      )}
      {book.wishlistTop.map((w, i) => (
        <Link
          key={w.id}
          href={wishlistHref}
          className="absolute block focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ left: u(400 + i * 120), top: u(i % 2 === 0 ? 430 : 456), width: u(130) }}
          aria-label={`Wishlist: ${w.text}`}
        >
          <Post left="50%" top={40} height={140} />
          <Board className="flex items-start gap-[0.35em] text-left" style={{ padding: `${u(8)} ${u(10)}`, transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
            <span aria-hidden className="mt-[0.15em] inline-block shrink-0 rounded-[2px] border-[1.5px]" style={{ width: u(13), height: u(13), borderColor: "var(--c4)" }} />
            <span className="font-hand-alt line-clamp-2" style={{ fontSize: u(15), lineHeight: 1.25, color: "var(--c4)" }}>
              {w.text}
            </span>
          </Board>
        </Link>
      ))}
    </div>
  );
}

export const Items = memo(function Items({
  layout,
  book,
  pagesById,
  wishlistHref,
  onCloseBook,
  station,
}: {
  layout: WorldLayout;
  book: BookV2;
  pagesById: Map<string, PageV2>;
  wishlistHref: string;
  onCloseBook?: () => void;
  station?: (page: PageV2) => StationHooks | undefined;
}) {
  return (
    <>
      {layout.segments.map((seg, i) => {
        if (seg.kind === "start") return <StartSign key={i} seg={seg} book={book} />;
        if (seg.kind === "sign") return <MonthSign key={i} seg={seg} />;
        if (seg.kind === "end") return <EndSegment key={i} seg={seg} book={book} wishlistHref={wishlistHref} onClose={onCloseBook} />;
        const page = pagesById.get(seg.pageId);
        return page ? (
          // The browser skips painting stops far off-screen. Paint containment
          // clips to this box, so it is padded for stickers that hang outside
          // the stop (template anchors reach 35u past its edges).
          <div
            key={seg.pageId}
            className="absolute top-0"
            style={{
              left: u(seg.x - 60),
              width: u(seg.w + 120),
              height: u(720),
              contentVisibility: "auto",
            }}
          >
            <Station page={page} x={60} label={`Halaman ${seg.index + 1}`} edit={station?.(page)} />
          </div>
        ) : null;
      })}
    </>
  );
});
