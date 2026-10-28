"use client";

import { memo, useId } from "react";
import { globalTrailPath } from "@/lib/v2/shapes";
import { THEMES, themeCssVars, type ThemeKey } from "@/lib/v2/themes";
import type { Seam, Slice } from "@/lib/v2/world";
import { Bush } from "./art/pieces";
import { KITS } from "./themes";

// The landscape behind (and one band in front of) the stops. Each layer is a
// strip that the World translates for parallax; inside it, one SVG per slice
// (one per segment) so the browser can skip painting the ones far away.
//
// content-visibility implies paint containment, which would clip clouds and
// cities at the slice edge, so every slice box is padded by PAD units on both
// sides; the continuous bands are clipped to the slice's exact range instead,
// and neighbouring slices meet seamlessly because the kits draw on a global
// grid.

export type LayerName = "sky" | "mid" | "ground" | "front";

const PAD = 300;

type SliceProps = {
  layer: LayerName;
  x0: number;
  x1: number;
  theme: ThemeKey;
  seamTo: { from: ThemeKey; to: ThemeKey } | null;
  s: number;
  topU: number;
  bottomU: number;
};

const SliceSvg = memo(function SliceSvg({ layer, x0, x1, theme, seamTo, s, topU, bottomU }: SliceProps) {
  const clipId = useId().replace(/:/g, "");
  const kit = KITS[theme];
  const span = { x0, x1, seed: 0, top: topU };
  const art = kit[layer](span);
  const bx0 = x0 - PAD;
  const bw = x1 - x0 + 2 * PAD;
  const h = 720 - topU + bottomU;

  return (
    <div
      className="absolute top-0"
      style={{
        left: bx0 * s,
        width: bw * s,
        height: h * s,
        contentVisibility: "auto",
        containIntrinsicSize: `${bw * s}px ${h * s}px`,
      }}
    >
      <svg
        aria-hidden
        width={bw * s}
        height={h * s}
        viewBox={`${bx0} ${topU} ${bw} ${h}`}
        style={themeCssVars(THEMES[theme]) as React.CSSProperties}
      >
        <defs>
          <clipPath id={clipId}>
            {/* a hair of overlap so anti-aliased edges never leave a seam line */}
            <rect x={x0 - 0.75} y={topU - 10} width={x1 - x0 + 1.5} height={h + 20} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {art.bands}
          {layer === "ground" && (
            <path
              d={globalTrailPath(x0, x1, 642, 8, 520)}
              fill="none"
              stroke="#fffaf2"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="1 14"
              opacity={0.8}
            />
          )}
          {layer === "front" && <rect x={x0} y={714} width={x1 - x0} height={bottomU + 16} style={{ fill: "var(--deep)" }} />}
        </g>
        {art.items}
        {layer === "ground" && seamTo && (
          <Bush x={x0} y={600} left={THEMES[seamTo.from].c4} right={THEMES[seamTo.to].c3} deep={THEMES[seamTo.to].c4} />
        )}
      </svg>
    </div>
  );
});

export function SceneryLayer({
  layer,
  f,
  slices,
  seams,
  worldW,
  vu,
  s,
  topU,
  bottomU,
  layerRef,
}: {
  layer: LayerName;
  f: number;
  slices: Slice[];
  seams: Seam[];
  worldW: number;
  /** viewport width in units */
  vu: number;
  s: number;
  topU: number;
  bottomU: number;
  layerRef?: (el: HTMLDivElement | null) => void;
}) {
  // Layer space: a layer moving at factor f is f·(W − vw) + vw wide, and a
  // world boundary at x appears at f·x + (1 − f)·vw/2 — so it lines up with
  // the world when it is at the centre of the screen.
  const map = (x: number) => f * x + ((1 - f) * vu) / 2;
  const layerW = f === 1 ? worldW : f * Math.max(0, worldW - vu) + vu;
  const h = 720 - topU + bottomU;

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0"
      style={{ width: layerW * s, height: h * s, willChange: f === 1 ? undefined : "transform" }}
    >
      {slices.map((sl, i) => {
        const seam = seams.find((sm) => sm.x === sl.x0);
        return (
          <SliceSvg
            key={i}
            layer={layer}
            x0={i === 0 ? map(sl.x0) - 200 : map(sl.x0)}
            x1={i === slices.length - 1 ? map(sl.x1) + 200 : map(sl.x1)}
            theme={sl.theme}
            seamTo={seam ? { from: seam.from, to: seam.to } : null}
            s={s}
            topU={topU}
            bottomU={bottomU}
          />
        );
      })}
    </div>
  );
}
