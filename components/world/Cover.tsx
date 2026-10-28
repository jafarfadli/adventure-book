"use client";

import { useEffect, useState } from "react";
import { globalScallopPath, globalWavePath } from "@/lib/v2/shapes";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";
import type { BookV2 } from "@/lib/v2/types";
import { EDGE, FELT_URL, GRAIN_URL, LIFT } from "./art/defs";
import { FitLine } from "./items/FitLine";
import { KITS } from "./themes";

// The closed book: a felt board in the book's theme with a stitched spine,
// a title label, and the cover photo seen through a die-cut arch window.
// Drawn on a 480×720 grid (`--cu` = px per cover unit) so it scales cleanly.

const cu = (n: number) => `calc(var(--cu) * ${n})`;

type CoverBook = Pick<BookV2, "title" | "theme" | "coverImageUrl" | "coverFocusX" | "coverFocusY" | "coverText">;

export function Cover({ book, back = false, className = "" }: { book: CoverBook; back?: boolean; className?: string }) {
  const theme: ThemeKey = book.theme;
  const kit = KITS[theme];
  const skyPiece = kit.stickers.sky[0];
  const groundA = kit.stickers.ground[0];
  const groundB = kit.stickers.ground[1] ?? groundA;
  return (
    <div
      className={`relative select-none ${className}`}
      style={{ aspectRatio: "2 / 3", containerType: "inline-size", ...(themeCssVars(THEMES[theme]) as React.CSSProperties) }}
    >
      <div className="absolute inset-0" style={{ ["--cu" as string]: "calc(100cqw / 480)" } as React.CSSProperties}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: "var(--c3)",
            borderRadius: back ? `${cu(14)} ${cu(4)} ${cu(4)} ${cu(14)}` : `${cu(4)} ${cu(14)} ${cu(14)} ${cu(4)}`,
            boxShadow: `0 ${cu(14)} ${cu(28)} rgba(40,10,26,0.38)`,
          }}
        >
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 480 720" preserveAspectRatio="none">
            {!back && (
              <g transform="translate(404 150) scale(2.1)" style={{ opacity: 0.95 }}>
                {skyPiece.draw()}
              </g>
            )}
            <path d={globalWavePath(0, 480, back ? 600 : 590, 22, 340, 0)} style={{ fill: "var(--c2)" }} filter={EDGE} />
            <path d={globalScallopPath(0, 480, 632, 24)} style={{ fill: "var(--c1)" }} filter={EDGE} />
            <path d={globalWavePath(0, 480, 680, 10, 210, 30)} style={{ fill: "var(--c4)" }} filter={EDGE} />
            <g transform="translate(86 678) scale(1.1)" filter={LIFT}>
              {groundA.draw()}
            </g>
            <g transform="translate(408 672)">{groundB.draw()}</g>
          </svg>
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.45 }} />
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: FELT_URL, opacity: 0.22 }} />
          {/* stitched spine */}
          <div
            aria-hidden
            className="absolute inset-y-0"
            style={{ [back ? "right" : "left"]: 0, width: cu(28), background: "var(--c4)", opacity: 0.55 }}
          />
          <div
            aria-hidden
            className="absolute"
            style={{
              [back ? "right" : "left"]: cu(21),
              top: cu(12),
              bottom: cu(12),
              borderLeft: `${cu(1.6)} dashed rgba(255,255,255,0.75)`,
            }}
          />
        </div>

        {!back && (
          <>
            {/* die-cut window: the photo shows through a hole in the board */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: cu(150),
                top: cu(236),
                width: cu(180),
                height: cu(280),
                borderRadius: `${cu(90)} ${cu(90)} 0 0`,
                boxShadow: `0 0 0 ${cu(3)} var(--c2)`,
                background: "var(--c4)",
              }}
            >
              {book.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImageUrl}
                  alt="foto sampul"
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${book.coverFocusX * 100}% ${book.coverFocusY * 100}%` }}
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ borderRadius: "inherit", boxShadow: `inset ${cu(2)} ${cu(7)} ${cu(9)} rgba(42,10,26,0.55)` }}
              />
            </div>

            <div
              className="absolute text-center"
              style={{
                left: cu(76),
                top: cu(66),
                width: cu(328),
                padding: `${cu(14)} ${cu(12)} ${cu(16)}`,
                background: "var(--paper)",
                borderRadius: cu(16),
                transform: "rotate(-2deg)",
                boxShadow: `inset 0 0 0 ${cu(8)} var(--paper), inset 0 0 0 ${cu(10)} var(--c2), ${cu(2)} ${cu(4)} ${cu(6)} rgba(30,16,20,0.3)`,
              }}
            >
              <FitLine text={book.title} size={cu(50)} className="font-hand font-bold" style={{ lineHeight: 1.1, color: "var(--c4)" }} />
              <div className="font-hand-alt" style={{ fontSize: cu(17), color: "var(--c3)" }}>
                Adventure Book
              </div>
            </div>

            {book.coverText && (
              <div
                className="absolute truncate text-center font-hand font-bold"
                style={{
                  left: cu(105),
                  top: cu(542),
                  width: cu(270),
                  padding: `${cu(6)} ${cu(14)}`,
                  fontSize: cu(23),
                  background: "#fffdf8",
                  color: "var(--ink)",
                  transform: "rotate(2deg)",
                  boxShadow: `${cu(2)} ${cu(4)} ${cu(6)} rgba(30,16,20,0.3)`,
                }}
              >
                {book.coverText}
              </div>
            )}

            {/* corner protectors */}
            <span aria-hidden className="absolute" style={{ right: 0, top: 0, width: cu(42), height: cu(42), background: "var(--accent)", clipPath: "polygon(0 0, 100% 0, 100% 100%)", borderTopRightRadius: cu(14) }} />
            <span aria-hidden className="absolute" style={{ right: 0, bottom: 0, width: cu(42), height: cu(42), background: "var(--accent)", clipPath: "polygon(100% 0, 100% 100%, 0 100%)", borderBottomRightRadius: cu(14) }} />
          </>
        )}

        {back && (
          <div
            className="absolute grid place-content-center text-center"
            style={{
              left: cu(170),
              top: cu(250),
              width: cu(150),
              height: cu(150),
              borderRadius: "50%",
              background: "var(--paper)",
              transform: "rotate(-4deg)",
              boxShadow: `inset 0 0 0 ${cu(10)} var(--paper), inset 0 0 0 ${cu(12)} var(--c2), ${cu(2)} ${cu(4)} ${cu(6)} rgba(30,16,20,0.3)`,
            }}
          >
            <span className="font-hand font-bold" style={{ fontSize: cu(30), color: "var(--c4)", lineHeight: 1 }}>
              bersambung
            </span>
          </div>
        )}

        {/* ribbon bookmark */}
        <span
          aria-hidden
          className="absolute"
          style={{
            [back ? "left" : "right"]: cu(64),
            bottom: cu(-46),
            width: cu(20),
            height: cu(60),
            background: "var(--accent)",
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * The shut book in front of the world. Tap anywhere: it grows and fades as if
 * the camera moves into the cover, then the world is there.
 */
export function CoverOverlay({
  book,
  back = false,
  reduceMotion,
  onDone,
  label,
}: {
  book: CoverBook;
  back?: boolean;
  reduceMotion: boolean;
  onDone: () => void;
  label: string;
}) {
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    if (!opening) return;
    const t = setTimeout(onDone, reduceMotion ? 0 : 760);
    return () => clearTimeout(t);
  }, [opening, onDone, reduceMotion]);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setOpening(true)}
      className="absolute inset-0 z-40 grid place-items-center outline-none"
      style={{
        background: `color-mix(in srgb, ${THEMES[book.theme].c1} 55%, ${THEMES[book.theme].paper})`,
        opacity: opening ? 0 : 1,
        transition: reduceMotion ? "none" : "opacity 520ms ease 240ms",
      }}
    >
      <div
        className="w-[min(76vw,calc(62vh*2/3))]"
        style={{
          transform: opening ? "scale(3.2)" : "scale(1)",
          transition: reduceMotion ? "none" : "transform 760ms cubic-bezier(.3,.7,.2,1)",
        }}
      >
        <Cover book={book} back={back} />
      </div>
    </button>
  );
}
