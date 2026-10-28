"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/v2/Icon";
import { cardBox, ratioValue, windowOffset, windowSize, type FrameSpec } from "@/lib/v2/templates";
import type { SlotV2 } from "@/lib/v2/types";
import type { Mount as MountKind } from "../themes";
import { Mount } from "./Mount";
import { PhotoWindow } from "./PhotoWindow";
import { CARD_SHADOW, u } from "./units";

const FILM = "#2d2622";

/** Sprocket holes along one long edge. */
function Sprockets({ vertical, style }: { vertical: boolean; style: React.CSSProperties }) {
  const hole = vertical
    ? `repeating-linear-gradient(to bottom, transparent 0 ${u(9)}, var(--paper) ${u(9)} ${u(24)}, transparent ${u(24)} ${u(32)})`
    : `repeating-linear-gradient(to right, transparent 0 ${u(9)}, var(--paper) ${u(9)} ${u(24)}, transparent ${u(24)} ${u(32)})`;
  return <span aria-hidden className="pointer-events-none absolute" style={{ backgroundImage: hole, opacity: 0.92, ...style }} />;
}

/**
 * Video in a strip of film: poster + play button until tapped, then an
 * inline player (playsInline, so iOS does not jump to fullscreen). Pauses on
 * its own when scrolled away.
 */
export function FilmFrame({
  frame,
  slot,
  mount,
  lowRes,
  interactive = true,
}: {
  frame: FrameSpec;
  slot: SlotV2 | undefined;
  mount: MountKind;
  lowRes?: boolean;
  interactive?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const box = cardBox(frame);
  const win = windowSize(frame);
  const off = windowOffset(frame);
  const vertical = ratioValue(frame.ratio) < 1;

  useEffect(() => {
    const el = videoRef.current;
    if (!playing || !el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio < 0.25) el.pause();
    }, { threshold: [0, 0.25] });
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  return (
    <div
      data-slot={frame.key}
      className="absolute"
      style={{
        left: u(box.x),
        top: u(box.y),
        width: u(box.w),
        height: u(box.h),
        background: FILM,
        borderRadius: u(4),
        boxShadow: CARD_SHADOW,
        transform: `rotate(${frame.rot}deg)`,
      }}
    >
      {vertical ? (
        <>
          <Sprockets vertical style={{ left: u(9), top: u(4), width: u(11), bottom: u(4) }} />
          <Sprockets vertical style={{ right: u(9), top: u(4), width: u(11), bottom: u(4) }} />
        </>
      ) : (
        <>
          <Sprockets vertical={false} style={{ top: u(9), left: u(4), height: u(11), right: u(4) }} />
          <Sprockets vertical={false} style={{ bottom: u(9), left: u(4), height: u(11), right: u(4) }} />
        </>
      )}
      <div className="absolute overflow-hidden" style={{ left: u(off.dx), top: u(off.dy), width: u(win.w), height: u(win.h) }}>
        {playing && slot?.videoUrl ? (
          <video
            ref={videoRef}
            src={slot.videoUrl}
            poster={slot.imageUrl ?? undefined}
            controls
            autoPlay
            playsInline
            preload="none"
            className="h-full w-full bg-black object-cover"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <PhotoWindow slot={slot} w={win.w} h={win.h} lowRes={lowRes} />
            {slot?.videoUrl && (
              <button
                type="button"
                aria-label="Putar video"
                title="Putar video"
                disabled={!interactive}
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaying(true);
                }}
                className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fffdf8]/90 text-[#2b2326] shadow-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-white"
                style={{ width: u(56), height: u(56) }}
              >
                <Icon name="play" className="h-1/2 w-1/2 translate-x-[6%]" />
              </button>
            )}
          </>
        )}
      </div>
      <Mount kind={mount} cardW={box.w} />
    </div>
  );
}

/** Paper label under the film carrying the video's caption. */
export function CaptionLabel({ box, text }: { box: { x: number; y: number; w: number; h: number; rot: number }; text: string }) {
  return (
    <div
      data-caption="video1"
      className="absolute truncate px-2 text-center font-hand font-bold"
      style={{
        left: u(box.x),
        top: u(box.y),
        width: u(box.w),
        height: u(box.h),
        lineHeight: u(box.h),
        fontSize: u(24),
        color: "var(--ink)",
        background: "#fffdf8",
        boxShadow: CARD_SHADOW,
        transform: `rotate(${box.rot}deg)`,
      }}
    >
      {text}
    </div>
  );
}
