"use client";

import { TEMPLATES } from "@/lib/v2/templates";
import { THEMES, themeCssVars } from "@/lib/v2/themes";
import { globalTrailPath } from "@/lib/v2/shapes";
import type { PageV2 } from "@/lib/v2/types";
import { GRAIN_URL } from "./art/defs";
import { Station } from "./Station";
import { KITS } from "./themes";

const MARGIN = 45;

/**
 * A single stop with its own slice of landscape: used by the dev gallery and
 * the editor's page tiles. Same Station, same kit art as the world — only the
 * parallax is missing. Needs <WorldDefs /> once in the document.
 */
export function StationScene({
  page,
  height,
  lowRes,
  className = "",
}: {
  page: PageV2;
  /** rendered height in px; the scene keeps the 720u-tall proportion */
  height: number;
  lowRes?: boolean;
  className?: string;
}) {
  const t = TEMPLATES[page.template];
  const kit = KITS[page.theme];
  const theme = THEMES[page.theme];
  const s = height / 720;
  const W = t.width + MARGIN * 2;
  const span = { x0: -MARGIN, x1: t.width + MARGIN, seed: 0, top: 0 };
  const sky = kit.sky(span);
  const mid = kit.mid(span);
  const ground = kit.ground(span);
  const front = kit.front(span);
  const viewBox = `${-MARGIN} 0 ${W} 720`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: W * s, height, background: theme.sky, ...themeCssVars(theme), ["--u" as string]: `${s}px` } as React.CSSProperties}
    >
      <svg aria-hidden className="absolute inset-0" width={W * s} height={height} viewBox={viewBox}>
        {sky.items}
        {mid.bands}
        {mid.items}
        {ground.bands}
        {ground.items}
        <path
          d={globalTrailPath(-MARGIN, t.width + MARGIN, 642, 8, 520)}
          fill="none"
          stroke="#fffaf2"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="1 14"
          opacity={0.8}
        />
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN_URL, mixBlendMode: "multiply", opacity: 0.34 }} />
      <div className="absolute inset-y-0" style={{ left: MARGIN * s, width: t.width * s }}>
        <Station page={page} lowRes={lowRes} interactive={false} />
      </div>
      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W * s} height={height} viewBox={viewBox}>
        {front.bands}
        {front.items}
      </svg>
    </div>
  );
}
