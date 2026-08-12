"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotData } from "@/lib/types";

// Sprocket holes down both edges of the film border.
function Sprockets({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`absolute inset-y-2 flex w-4 flex-col items-center justify-between ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} className="h-2 w-2.5 rounded-[2px] bg-[#f5eddb]" />
      ))}
    </span>
  );
}

/**
 * "Film paper" frame: a dark film border with sprocket holes, the clip in the
 * middle, tilted to sit alongside the polaroids. The poster shows until the
 * reader taps play — clips are never autoloaded (preload="none").
 */
export function FilmFrame({
  slot,
  className = "max-w-64",
}: {
  slot: SlotData;
  /** Must set the frame's max width, like PolaroidFrame. */
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLElement | null>(null);
  const alt = slot.caption || "video kenangan";

  // StPageFlip turns pages from native listeners on an ancestor, and those run
  // before React's delegated handlers — so a React onClick here would start
  // playback *and* flip the page. Handle it natively at the target instead,
  // where stopPropagation still gets there first.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const swallow = (e: Event) => e.stopPropagation();
    const onClick = (e: Event) => {
      e.stopPropagation();
      if ((e.target as Element | null)?.closest("[data-ab-play]")) setPlaying(true);
    };
    el.addEventListener("click", onClick);
    for (const type of ["mousedown", "mouseup", "touchstart", "touchend"]) {
      el.addEventListener(type, swallow);
    }
    return () => {
      el.removeEventListener("click", onClick);
      for (const type of ["mousedown", "mouseup", "touchstart", "touchend"]) {
        el.removeEventListener(type, swallow);
      }
    };
  }, []);

  return (
    <figure
      className={`relative w-full ${className}`}
      style={{ transform: `rotate(${slot.rotation}deg)` }}
      ref={frameRef}
    >
      <div className="relative bg-[#23201c] px-5 py-3 shadow-xl shadow-black/30">
        <Sprockets side="left" />
        <Sprockets side="right" />
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          {slot.videoUrl ? (
            playing ? (
              <video
                src={slot.videoUrl}
                poster={slot.imageUrl ?? undefined}
                controls
                autoPlay
                // playsInline keeps iOS from hijacking the whole screen.
                playsInline
                preload="none"
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                data-ab-play
                aria-label={`Putar video: ${alt}`}
                className="group relative h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {slot.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slot.imageUrl}
                    alt={alt}
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/10">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 pl-1 text-2xl text-stone-800 shadow-lg">
                    ▶
                  </span>
                </span>
              </button>
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-stone-600 text-stone-400">
              <span className="font-hand text-xl">belum ada video</span>
            </div>
          )}
        </div>
      </div>
      {(slot.caption || slot.dateLabel) && (
        <figcaption className="px-1 pt-2 text-center">
          {slot.caption && (
            <span className="font-hand text-2xl leading-tight text-stone-700">
              {slot.caption}
            </span>
          )}
          {slot.dateLabel && (
            <span className="mt-0.5 block font-hand text-lg text-stone-400">
              {slot.dateLabel}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
