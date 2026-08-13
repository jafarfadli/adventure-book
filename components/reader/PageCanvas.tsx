"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The page is always composed at this exact size and then scaled to whatever
 * box it lands in. Layouts size frames and text in absolute units, so drawing
 * them straight into a 336px phone page and a 448px desktop page produced two
 * different compositions — photos looked far bigger, and crowded, on mobile.
 * Composing once and scaling keeps every surface (phone, desktop, editor
 * preview) pixel-identical apart from zoom.
 */
export const PAGE_W = 460;
export const PAGE_H = 620;

export function PageCanvas({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / PAGE_W),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={`relative overflow-hidden ${className}`} style={style}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${scale})`,
          // Hidden for the first frame only, so an unscaled page never flashes.
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
