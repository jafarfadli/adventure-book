"use client";

import { useEffect, useRef, useState } from "react";
import { frameBox, toFrameFormat } from "@/lib/frames";
import type { SlotData } from "@/lib/types";

// Sprocket holes run down the long edges of the strip: vertically for
// portrait/square film, along the top and bottom for landscape.
function Sprockets({
  side,
  count,
  vertical,
}: {
  side: "start" | "end";
  count: number;
  vertical: boolean;
}) {
  const holes = Array.from({ length: count }).map((_, i) => (
    <span
      key={i}
      className={`rounded-[2px] bg-[#f5eddb] ${vertical ? "h-2 w-2.5" : "h-2.5 w-2"}`}
    />
  ));
  return (
    <span
      aria-hidden
      className={
        vertical
          ? `absolute inset-y-2 flex w-4 flex-col items-center justify-between ${
              side === "start" ? "left-0" : "right-0"
            }`
          : `absolute inset-x-2 flex h-4 items-center justify-between ${
              side === "start" ? "top-0" : "bottom-0"
            }`
      }
    >
      {holes}
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
  size,
  maxHeight,
  className = "",
}: {
  slot: SlotData;
  /** Optical size from the FRAME_SIZE scale — not a width (see frameBox). */
  size: number;
  /** Layout's height ceiling, so a portrait clip can't outgrow the page. */
  maxHeight?: number;
  /** Positioning only — the box comes from size + format. */
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLElement | null>(null);
  const alt = slot.caption || "video kenangan";
  const format = toFrameFormat(slot.aspect);
  const { width, height } = frameBox(size, format, maxHeight);
  // Landscape film runs horizontally, so its sprockets move to top/bottom.
  const vertical = format !== "landscape";
  const holes = format === "portrait" ? 9 : format === "square" ? 7 : 8;

  // StPageFlip turns pages from native listeners on an ancestor, and those run
  // before React's delegated handlers — so a React onClick here would start
  // playback *and* flip the page. Handle it natively at the target instead,
  // where stopPropagation still gets there first.
  //
  // Touches are only held back while the clip is playing, so the controls can
  // be scrubbed. Before that the frame lets them through: it covers most of
  // the page, and swallowing them would make the page unswipeable.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const swallow = (e: Event) => e.stopPropagation();
    const onClick = (e: Event) => {
      e.stopPropagation();
      if ((e.target as Element | null)?.closest("[data-ab-play]")) setPlaying(true);
    };
    const mouse = ["mousedown", "mouseup"];
    const touch = playing ? ["touchstart", "touchend", "touchmove"] : [];
    el.addEventListener("click", onClick);
    for (const type of [...mouse, ...touch]) el.addEventListener(type, swallow);
    return () => {
      el.removeEventListener("click", onClick);
      for (const type of [...mouse, ...touch]) el.removeEventListener(type, swallow);
    };
  }, [playing]);

  return (
    <figure
      className={`relative max-w-full ${className}`}
      style={{
        width: width + (vertical ? 40 : 24),
        transform: `rotate(${slot.rotation}deg)`,
      }}
      ref={frameRef}
    >
      <div
        className={`relative bg-[#23201c] shadow-xl shadow-black/30 ${
          vertical ? "px-5 py-3" : "px-3 py-5"
        }`}
      >
        <Sprockets side="start" count={holes} vertical={vertical} />
        <Sprockets side="end" count={holes} vertical={vertical} />
        <div className="relative w-full overflow-hidden bg-black" style={{ height }}>
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
