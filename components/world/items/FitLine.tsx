"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * One line of handwriting that shrinks to fit its box (down to `min` of its
 * size) before it ellipsizes, so a longer title the couple typed still reads
 * whole. `size` is any CSS length. The fit factor is measured on the client
 * (again once the fonts are in, and when the box changes width) and kept in
 * `--fit`, which React never writes.
 */
export function FitLine({
  text,
  size,
  min = 0.6,
  className = "",
  style,
}: {
  text: string;
  size: string;
  min?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.setProperty("--fit", "1");
      const need = el.scrollWidth;
      const have = el.clientWidth;
      // a hair under the exact ratio, or rounding brings the ellipsis back
      el.style.setProperty("--fit", need > have ? String(Math.max(min, (have / need) * 0.98)) : "1");
    };
    fit();
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return; // a height change is our own doing
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    let live = true;
    void document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [text, min]);

  return (
    <div ref={ref} className={`truncate ${className}`} style={{ ...style, fontSize: `calc(${size} * var(--fit, 1))` }}>
      {text}
    </div>
  );
}
