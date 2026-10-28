"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

// The strip at the bottom: one dot per stop at the scroll position that
// centres it, a short month label where a month begins, and a knob that
// follows the scroll (moved imperatively, never re-rendered per frame).
// Drag or tap anywhere on the strip to travel.

export type TimelineHandle = { setProgress: (p: number) => void };

export const Timeline = forwardRef<
  TimelineHandle,
  {
    marks: { p: number; label: string | null; title: string }[];
    onSeek: (p: number, smooth: boolean) => void;
    light?: boolean;
  }
>(function Timeline({ marks, onSeek, light }, ref) {
  const knob = useRef<HTMLSpanElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => ({
    setProgress(p) {
      if (knob.current) knob.current.style.left = `${Math.min(1, Math.max(0, p)) * 100}%`;
    },
  }));

  // many stops on a narrow strip: smaller dots, and month labels only where
  // there is room for them (the first of two crowded labels wins)
  const dense = marks.length > 18;
  const labels: { p: number; label: string }[] = [];
  for (const m of marks) {
    if (!m.label) continue;
    const prev = labels[labels.length - 1];
    if (!prev || m.p - prev.p > 0.09) labels.push({ p: m.p, label: m.label });
  }

  const at = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  return (
    <div
      className="relative h-11 min-w-0 flex-1 cursor-pointer touch-none rounded-full px-4"
      style={{ background: light ? "rgba(255,250,245,0.94)" : "rgba(255,250,245,0.94)", boxShadow: "0 2px 8px rgba(40,10,30,0.2)" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onSeek(at(e.clientX), true);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onSeek(at(e.clientX), false);
      }}
      // pointer shortcut only: keyboard and screen-reader users travel with
      // the arrow keys on the world itself
      aria-hidden
    >
      <div ref={track} className="absolute inset-x-4 inset-y-0">
        <span aria-hidden className="absolute inset-x-0 top-[17px] border-t-2 border-dashed border-[#a5436a]/35" />
        {marks.map((m, i) => (
          <span
            key={i}
            title={m.title}
            className={`absolute -translate-x-1/2 rounded-full bg-[#c35d82] ${dense ? "top-[15px] h-1.5 w-1.5" : "top-[13px] h-2.5 w-2.5"}`}
            style={{ left: `${m.p * 100}%` }}
          />
        ))}
        {labels.map((m, i) => (
          <span
            key={`l${i}`}
            aria-hidden
            className="absolute top-[22px] -translate-x-1/2 font-hand text-[15px] font-bold whitespace-nowrap text-[#6b3a52]"
            style={{ left: `${m.p * 100}%` }}
          >
            {m.label}
          </span>
        ))}
        <span
          ref={knob}
          aria-hidden
          className="pointer-events-none absolute top-[17px] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#a5436a] bg-[#fffaf2] shadow"
          style={{ left: "0%" }}
        />
      </div>
    </div>
  );
});
