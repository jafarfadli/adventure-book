import { EDGE, LIFT } from "../art/defs";
import { Cloud, Moon, Star4 } from "../art/pieces";
import { globalWavePath, scatter } from "@/lib/v2/shapes";
import { fill, stroke, type Sticker, type ThemeKit } from "./types";

// Lavender · malam — a night sky (the only dark theme): moon, twinkling stars,
// little houses with lit windows, lanterns, popcorn and cinema tickets.

const SEED = 505;

function Lantern() {
  return (
    <g filter={LIFT}>
      <line x1={0} y1={-16} x2={0} y2={-26} style={stroke("var(--c1)")} strokeWidth={1.5} />
      <rect x={-6} y={-17} width={12} height={4} rx={1} style={fill("var(--c4)")} />
      <ellipse rx={11} ry={14} style={fill("var(--accent)")} />
      <path d="M0 -14 V14 M-6 -12 C -9 -4 -9 4 -6 12 M6 -12 C 9 -4 9 4 6 12" fill="none" style={stroke("var(--c4)")} strokeWidth={1} opacity={0.45} />
    </g>
  );
}

function Popcorn() {
  return (
    <g filter={LIFT}>
      <g style={fill("var(--cloud)")}>
        <circle cx={-14} cy={-20} r={8} />
        <circle cx={-2} cy={-26} r={9} />
        <circle cx={11} cy={-21} r={8} />
        <circle cx={-7} cy={-14} r={7} />
        <circle cx={7} cy={-14} r={7} />
      </g>
      <path d="M-20 -14 H20 L15 26 H-15Z" style={fill("var(--cloud)")} />
      <path d="M-12 -14 L-8.5 26 H-3 L-4.5 -14Z M4.5 -14 L3 26 H8.5 L12 -14Z" style={fill("var(--c3)")} />
    </g>
  );
}

function Admit() {
  return (
    <g filter={LIFT}>
      <path d="M-36 -18 H36 V-6 A6 6 0 0 0 36 6 V18 H-36 V6 A6 6 0 0 0 -36 -6Z" style={fill("var(--c2)")} />
      <path d="M-24 -6 H24 M-24 4 H14" style={stroke("var(--paper)")} strokeWidth={3} strokeLinecap="round" />
      <path d="M18 2 C 18 -2 24 -2 24 2 C 24 -2 30 -2 30 2 C 30 6 24 10 24 10 C 24 10 18 6 18 2Z" style={fill("var(--accent)")} />
    </g>
  );
}

function Clapper() {
  return (
    <g filter={LIFT}>
      <rect x={-26} y={-8} width={52} height={32} rx={3} style={fill("var(--c4)")} />
      <path d="M-26 -8 L-24 -22 L26 -14 L26 -8Z" style={fill("var(--c3)")} />
      <path d="M-16 -20 L-10 -9 M-2 -18 L4 -8 M12 -16 L18 -8" style={stroke("var(--cloud)")} strokeWidth={3} />
      <path d="M-18 4 H18 M-18 12 H8" style={stroke("var(--c1)")} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Mushroom() {
  return (
    <g filter={LIFT}>
      <path d="M-6 26 C -6 10 -4 2 -5 -2 H5 C 4 2 6 10 6 26Z" style={fill("var(--cloud)")} />
      <path d="M-26 -2 C -26 -22 26 -22 26 -2 Z" style={fill("var(--c2)")} />
      <g style={fill("var(--paper)")}>
        <circle cx={-12} cy={-10} r={3} />
        <circle cx={4} cy={-14} r={3.5} />
        <circle cx={14} cy={-6} r={2.5} />
      </g>
    </g>
  );
}

function Fireflies() {
  return (
    <g>
      {[
        [-14, -6, 4],
        [6, -16, 3],
        [16, 6, 3.5],
        [-2, 12, 2.5],
      ].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={r * 2.2} style={fill("var(--accent)")} opacity={0.22} />
          <circle cx={x} cy={y} r={r} style={fill("var(--accent)")} />
        </g>
      ))}
    </g>
  );
}

function StarSprig() {
  return (
    <g>
      <path d="M0 26 C -2 10 2 -2 0 -12" fill="none" style={stroke("var(--c3)")} strokeWidth={2.4} strokeLinecap="round" />
      <Star4 x={0} y={-18} s={1} />
      <Star4 x={-12} y={-2} s={0.6} />
      <Star4 x={11} y={4} s={0.7} />
    </g>
  );
}

function Houses({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`} filter={EDGE}>
      <g style={fill("var(--c4)")}>
        <path d="M0 520 V470 L30 446 L60 470 V520Z" />
        <path d="M70 520 V456 L98 432 L126 456 V520Z" />
        <rect x={136} y={480} width={46} height={40} />
      </g>
      <g style={fill("var(--accent)")}>
        <rect x={20} y={480} width={9} height={11} rx={1.5} />
        <rect x={36} y={480} width={9} height={11} rx={1.5} />
        <rect x={92} y={468} width={11} height={13} rx={1.5} />
        <rect x={150} y={490} width={9} height={10} rx={1.5} />
      </g>
    </g>
  );
}

const sticker = (name: string, draw: () => React.ReactNode): Sticker => ({ name, draw });

export const lavender: ThemeKit = {
  key: "lavender",
  mount: "dots",
  sky({ x0, x1, top }) {
    const y0 = Math.min(0, top);
    return {
      items: (
        <>
          {scatter(x0, x1, 1400, SEED, (x, r, i) => (
            <Moon key={`m${i}`} x={x} y={110 + r() * 40} s={1.6} r={-24} fill="var(--accent)" />
          ))}
          {scatter(x0, x1, 46, SEED + 1, (x, r, i) => (
            <Star4 key={`s${i}`} x={x} y={y0 + 24 + r() * (330 - y0)} s={0.25 + r() * 0.55} opacity={0.65 + r() * 0.35} />
          ))}
          {scatter(x0, x1, 420, SEED + 2, (x, r, i) => (
            <Cloud key={`c${i}`} x={x} y={150 + r() * 160} s={0.5 + r() * 0.4} fill="rgba(255,255,255,0.14)" shadow={false} />
          ))}
        </>
      ),
    };
  },
  mid({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 456, 34, 440, 10)} style={fill("var(--c3)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 506, 22, 320, 80)} style={fill("var(--c2)")} opacity={0.9} filter={EDGE} />
        </>
      ),
      items: scatter(x0, x1, 820, SEED + 6, (x, r, i) => <Houses key={i} x={x} />),
    };
  },
  ground({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 562, 22, 340, 0)} style={fill("var(--c2)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 612, 16, 260, 90)} style={fill("var(--c3)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 670, 10, 210, 30)} style={fill("var(--c4)")} filter={EDGE} />
        </>
      ),
    };
  },
  front({ x0, x1 }) {
    return {
      bands: <path d={globalWavePath(x0, x1, 700, 9, 150, 0)} style={fill("var(--deep)")} />,
      items: scatter(x0, x1, 400, SEED + 4, (x, r, i) => (
        <g key={i} transform={`translate(${x} ${694 - r() * 8}) scale(0.7)`}>
          {i % 2 === 0 ? <StarSprig /> : <Fireflies />}
        </g>
      )),
    };
  },
  stickers: {
    sky: [
      sticker("moon", () => <Moon x={0} y={0} s={0.9} r={-24} fill="var(--accent)" />),
      sticker("stars", () => (
        <>
          <Star4 x={-12} y={-8} s={1.4} />
          <Star4 x={14} y={6} s={0.9} />
          <Star4 x={-2} y={16} s={0.6} />
        </>
      )),
      sticker("lantern", Lantern),
    ],
    side: [sticker("popcorn", Popcorn), sticker("admit", Admit), sticker("clapper", Clapper)],
    ground: [sticker("mushroom", Mushroom), sticker("fireflies", Fireflies), sticker("sprig", StarSprig)],
  },
};
