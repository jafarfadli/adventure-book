import { EDGE, LIFT } from "../art/defs";
import { Cloud } from "../art/pieces";
import { globalWavePath, scatter } from "@/lib/v2/shapes";
import { fill, stroke, type Sticker, type ThemeKit } from "./types";

// Matcha · kafe & makan — rounded garden hedges, lollipop trees, a coral sun,
// cups, bowls of bakso and potted plants.

const SEED = 303;

function Leaf() {
  return (
    <g filter={LIFT}>
      <path d="M-18 10 C -18 -10 0 -20 18 -18 C 16 2 2 16 -18 10Z" style={fill("var(--c2)")} />
      <path d="M-16 8 C -4 0 6 -8 16 -16" fill="none" style={stroke("var(--c3)")} strokeWidth={1.6} />
    </g>
  );
}

function Cup() {
  return (
    <g filter={LIFT}>
      <ellipse cx={0} cy={22} rx={30} ry={7} style={fill("var(--accent)")} />
      <path d="M-22 -10 H22 L18 16 C 16 22 -16 22 -18 16Z" style={fill("var(--cloud)")} />
      <path d="M21 -4 C 34 -4 34 12 19 12" fill="none" style={stroke("var(--cloud)")} strokeWidth={5} />
      <ellipse cx={0} cy={-10} rx={22} ry={5} style={fill("var(--c2)")} />
      <path
        d="M-7 -22 C -12 -28 -2 -32 -7 -40 M5 -22 C 0 -28 10 -32 5 -40"
        fill="none"
        style={stroke("var(--c3)")}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </g>
  );
}

function Bowl() {
  return (
    <g filter={LIFT}>
      <path d="M8 -6 L30 -36 M14 -4 L36 -32" style={stroke("var(--c4)")} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M-32 0 H32 C 30 22 14 30 0 30 C -14 30 -30 22 -32 0Z" style={fill("var(--accent)")} />
      <ellipse cx={0} cy={0} rx={32} ry={7} style={fill("var(--c1)")} />
      <circle cx={-11} cy={-2} r={6} style={fill("var(--c4)")} />
      <circle cx={3} cy={-4} r={6.5} style={fill("var(--c4)")} />
      <circle cx={15} cy={-1} r={5.5} style={fill("var(--c4)")} />
      <path d="M-26 12 H26" style={stroke("var(--cloud)")} strokeWidth={2} opacity={0.6} />
    </g>
  );
}

function Pot() {
  return (
    <g filter={LIFT}>
      <path d="M-14 -4 C -26 -18 -24 -32 -16 -38 C -16 -26 -12 -14 -6 -4Z" style={fill("var(--c3)")} />
      <path d="M-2 -4 C -4 -22 2 -38 10 -46 C 10 -30 8 -16 6 -4Z" style={fill("var(--c2)")} />
      <path d="M8 -4 C 18 -16 28 -20 34 -18 C 26 -12 20 -8 16 -4Z" style={fill("var(--c3)")} />
      <path d="M-20 -4 H20 L15 26 H-15Z" style={fill("var(--accent)")} />
      <rect x={-22} y={-8} width={44} height={8} rx={2} style={fill("var(--accent)")} />
    </g>
  );
}

function Donut() {
  return (
    <g filter={LIFT}>
      <circle r={24} style={fill("var(--c1)")} />
      <path d="M-22 -4 C -20 -18 -6 -24 6 -22 C 18 -20 24 -8 22 4 C 16 0 10 6 4 2 C -2 8 -10 2 -14 6 C -18 2 -20 0 -22 -4Z" style={fill("var(--c2)")} />
      <circle r={8} style={fill("var(--paper)")} />
      <g style={stroke("var(--accent)")} strokeWidth={2.4} strokeLinecap="round">
        <path d="M-14 -12 l3 2 M2 -16 l-2 3 M12 -10 l3 1 M-8 -2 l-1 3 M14 0 l2 2" />
      </g>
    </g>
  );
}

function Croissant() {
  return (
    <g filter={LIFT}>
      <path d="M-30 6 C-26 -6 -16 -10 -8 -8 L-14 10 Z" style={fill("var(--c1)")} />
      <path d="M30 6 C26 -6 16 -10 8 -8 L14 10 Z" style={fill("var(--c1)")} />
      <path d="M-12 -10 C-6 -22 6 -22 12 -10 L8 14 H-8 Z" style={fill("var(--c2)")} />
      <path d="M-10 -2 L-4 12 M10 -2 L4 12 M0 -18 V12" style={stroke("var(--c3)")} strokeWidth={1.6} opacity={0.7} />
    </g>
  );
}

function Sprout() {
  return (
    <g filter={LIFT}>
      <path d="M0 26 V0" style={stroke("var(--c3)")} strokeWidth={3} strokeLinecap="round" />
      <path d="M0 2 C -4 -14 -20 -18 -26 -10 C -18 -2 -8 0 0 2Z" style={fill("var(--c2)")} />
      <path d="M0 -4 C 4 -20 20 -26 28 -18 C 20 -8 10 -6 0 -4Z" style={fill("var(--c3)")} />
      <ellipse cx={0} cy={28} rx={16} ry={4} style={fill("var(--c4)")} opacity={0.6} />
    </g>
  );
}

function Tree({ x, s }: { x: number; s: number }) {
  return (
    <g transform={`translate(${x} 520) scale(${s})`} filter={LIFT}>
      <rect x={-4} y={-10} width={8} height={40} rx={3} style={fill("var(--c4)")} />
      <circle cx={0} cy={-30} r={30} style={fill("var(--c3)")} />
      <circle cx={-12} cy={-40} r={10} style={fill("var(--c2)")} opacity={0.6} />
    </g>
  );
}

const sticker = (name: string, draw: () => React.ReactNode): Sticker => ({ name, draw });

export const matcha: ThemeKit = {
  key: "matcha",
  mount: "corners",
  sky({ x0, x1, top }) {
    return {
      items: (
        <>
          {scatter(x0, x1, 1500, SEED, (x, r, i) => (
            <g key={`sun${i}`} filter={LIFT}>
              <circle cx={x} cy={120 + r() * 40} r={54} style={fill("var(--accent)")} />
            </g>
          ))}
          {scatter(x0, x1, 330, SEED + 1, (x, r, i) => (
            <Cloud key={`c${i}`} x={x} y={60 + r() * 170} s={0.5 + r() * 0.5} />
          ))}
          {scatter(x0, x1, 620, SEED + 2, (x, r, i) => (
            <g key={`l${i}`} transform={`translate(${x} ${70 + r() * 230}) rotate(${r() * 360}) scale(${0.6 + r() * 0.4})`}>
              <Leaf />
            </g>
          ))}
          {top < -40 &&
            scatter(x0, x1, 280, SEED + 3, (x, r, i) => (
              <Cloud key={`t${i}`} x={x} y={top + 50 + r() * (-top - 70)} s={0.5 + r() * 0.4} />
            ))}
        </>
      ),
    };
  },
  mid({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 452, 34, 200, 20)} style={fill("var(--c1)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 506, 24, 160, 70)} style={fill("var(--c2)")} opacity={0.92} filter={EDGE} />
        </>
      ),
      items: scatter(x0, x1, 360, SEED + 6, (x, r, i) => <Tree key={i} x={x} s={0.7 + r() * 0.5} />),
    };
  },
  ground({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 560, 26, 220, 0)} style={fill("var(--c2)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 612, 18, 180, 60)} style={fill("var(--c3)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 672, 10, 160, 20)} style={fill("var(--c4)")} filter={EDGE} />
        </>
      ),
    };
  },
  front({ x0, x1 }) {
    return {
      bands: <path d={globalWavePath(x0, x1, 700, 9, 150, 0)} style={fill("var(--deep)")} />,
      items: scatter(x0, x1, 440, SEED + 4, (x, r, i) => (
        <g key={i} transform={`translate(${x} ${700 - r() * 6}) scale(0.62)`}>
          {i % 2 === 0 ? <Pot /> : <Sprout />}
        </g>
      )),
    };
  },
  stickers: {
    sky: [
      sticker("leaf", Leaf),
      sticker("sun", () => (
        <g filter={LIFT}>
          <circle r={22} style={fill("var(--accent)")} />
        </g>
      )),
      sticker("cloud", () => <Cloud x={4} y={0} s={0.62} />),
    ],
    side: [sticker("cup", Cup), sticker("donut", Donut), sticker("croissant", Croissant)],
    ground: [sticker("pot", Pot), sticker("bowl", Bowl), sticker("sprout", Sprout)],
  },
};
