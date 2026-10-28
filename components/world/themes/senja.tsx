import { EDGE, LIFT } from "../art/defs";
import { Cloud, Moon } from "../art/pieces";
import { globalPeaksPath, globalWavePath, scatter } from "@/lib/v2/shapes";
import { fill, stroke, type Sticker, type ThemeKit } from "./types";

// Senja · jalan-jalan — ochre mountains, a small paper city with arched
// windows, palms, tickets and hot-air balloons.

const SEED = 202;

function Palm({ s = 1 }: { s?: number }) {
  return (
    <g filter={LIFT} transform={s !== 1 ? `scale(${s})` : undefined}>
      <path d="M0 0 C 3 -22 2 -44 -4 -64" fill="none" style={stroke("var(--c4)")} strokeWidth={6} strokeLinecap="round" />
      <g style={fill("var(--accent)")}>
        <path d="M-4 -64 C -20 -76 -38 -72 -46 -60 C -30 -66 -18 -64 -4 -64Z" />
        <path d="M-4 -64 C 10 -78 30 -76 40 -64 C 24 -68 10 -66 -4 -64Z" />
        <path d="M-4 -64 C -16 -60 -28 -48 -30 -36 C -20 -48 -12 -56 -4 -64Z" />
        <path d="M-4 -64 C 8 -60 20 -50 24 -38 C 14 -48 6 -56 -4 -64Z" />
        <path d="M-4 -64 C -6 -78 -2 -88 6 -92 C 2 -82 0 -74 -4 -64Z" />
      </g>
    </g>
  );
}

function Balloon() {
  return (
    <g filter={LIFT}>
      <path d="M0 -30 C 22 -30 28 -4 8 14 L-8 14 C -28 -4 -22 -30 0 -30Z" style={fill("var(--c2)")} />
      <path d="M0 -30 C 9 -30 11 -4 4 14 L-4 14 C -11 -4 -9 -30 0 -30Z" style={fill("var(--c3)")} />
      <path d="M-7 14 L-6 24 M7 14 L6 24" style={stroke("var(--c4)")} strokeWidth={1.4} />
      <rect x={-7} y={23} width={14} height={10} rx={2} style={fill("var(--c4)")} />
    </g>
  );
}

function Ticket() {
  return (
    <g filter={LIFT}>
      <path d="M-34 -16 H34 V-6 A6 6 0 0 0 34 6 V16 H-34 V6 A6 6 0 0 0 -34 -6Z" style={fill("var(--c2)")} />
      <line x1={16} y1={-14} x2={16} y2={14} style={stroke("var(--paper)")} strokeWidth={1.6} strokeDasharray="3 3" />
      <path d="M-24 -4 H6 M-24 4 H0" style={stroke("var(--paper)")} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function Plane() {
  return (
    <g filter={LIFT}>
      <path d="M-28 2 L26 -16 L4 16 L-2 4 Z" style={fill("var(--cloud)")} />
      <path d="M-2 4 L26 -16 L6 6 Z" style={fill("var(--c1)")} />
      <path d="M-30 12 C -40 16 -46 22 -48 28" fill="none" style={stroke("var(--c3)")} strokeWidth={1.8} strokeDasharray="3 4" strokeLinecap="round" />
    </g>
  );
}

function Compass() {
  return (
    <g filter={LIFT}>
      <circle r={24} style={fill("var(--paper)")} />
      <circle r={19} fill="none" style={stroke("var(--c2)")} strokeWidth={2} />
      <path d="M0 -15 L5 0 L0 15 L-5 0 Z" style={fill("var(--c3)")} />
      <path d="M0 -15 L5 0 L-5 0 Z" style={fill("var(--c4)")} />
      <circle r={2.4} style={fill("var(--paper)")} />
    </g>
  );
}

function Postcard() {
  return (
    <g filter={LIFT}>
      <rect x={-30} y={-20} width={60} height={40} rx={2} style={fill("var(--paper)")} />
      <rect x={12} y={-15} width={13} height={15} style={fill("var(--c2)")} />
      <path d="M-24 -8 H4 M-24 0 H4 M-24 8 H-2 M8 -18 V18" style={stroke("var(--c3)")} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function Cactus() {
  return (
    <g filter={LIFT}>
      <path d="M-6 30 V-18 A6 6 0 0 1 6 -18 V30 Z" style={fill("var(--accent)")} />
      <path d="M-6 6 H-14 A5 5 0 0 1 -19 1 V-8 A4 4 0 0 1 -11 -8 V-2 H-6" style={fill("var(--accent)")} />
      <path d="M6 12 H14 A5 5 0 0 0 19 7 V-2 A4 4 0 0 0 11 -2 V4 H6" style={fill("var(--accent)")} />
      <path d="M-14 30 H14 L11 22 H-11 Z" style={fill("var(--c3)")} />
    </g>
  );
}

function Rock() {
  return (
    <g filter={LIFT}>
      <path d="M-26 14 C-26 -2 -14 -14 2 -14 C16 -14 26 -2 26 14 Z" style={fill("var(--c3)")} />
      <path d="M-10 -6 C-4 -10 4 -10 8 -6" fill="none" style={stroke("var(--c1)")} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

/** A few domed houses and a clock tower, cut from the lightest paper. */
function City({ x }: { x: number }) {
  return (
    <g filter={EDGE}>
      <g style={fill("var(--c1)")}>
        <rect x={x} y={400} width={70} height={140} />
        <circle cx={x + 35} cy={400} r={22} />
        <rect x={x + 78} y={436} width={54} height={104} />
        <rect x={x + 140} y={340} width={40} height={200} />
        <rect x={x + 188} y={420} width={80} height={120} />
        <circle cx={x + 228} cy={420} r={18} />
      </g>
      <path d={`M${x + 136} 340 L${x + 160} 304 L${x + 184} 340Z`} style={fill("var(--c3)")} />
      <g style={fill("var(--c3)")} opacity={0.75}>
        <rect x={x + 14} y={430} width={12} height={16} rx={6} />
        <rect x={x + 44} y={430} width={12} height={16} rx={6} />
        <rect x={x + 152} y={360} width={16} height={12} />
        <rect x={x + 206} y={446} width={12} height={16} rx={6} />
        <rect x={x + 236} y={446} width={12} height={16} rx={6} />
        <rect x={x + 96} y={460} width={10} height={14} rx={5} />
      </g>
    </g>
  );
}

const sticker = (name: string, draw: () => React.ReactNode): Sticker => ({ name, draw });

export const senja: ThemeKit = {
  key: "senja",
  mount: "kraft",
  sky({ x0, x1, top }) {
    return {
      items: (
        <>
          {scatter(x0, x1, 1500, SEED, (x, r, i) => (
            <g key={`sun${i}`} filter={LIFT}>
              <circle cx={x} cy={200 + r() * 30} r={70} style={fill("var(--c2)")} />
            </g>
          ))}
          {scatter(x0, x1, 1500, SEED + 5, (x, r, i) => (
            <Moon key={`m${i}`} x={x + 500} y={90 + r() * 40} s={0.9} r={-20} fill="var(--cloud)" />
          ))}
          {scatter(x0, x1, 320, SEED + 1, (x, r, i) => (
            <Cloud key={`c${i}`} x={x} y={60 + r() * 180} s={0.5 + r() * 0.5} />
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
      bands: <path d={globalPeaksPath(x0, x1, 470, 170, SEED)} style={fill("var(--c1)")} filter={EDGE} />,
      items: (
        <>
          {scatter(x0, x1, 1100, SEED + 6, (x, r, i) => (
            <City key={`city${i}`} x={x} />
          ))}
          {scatter(x0, x1, 520, SEED + 7, (x, r, i) => (
            <g key={`p${i}`} transform={`translate(${x} ${548 + r() * 10})`} opacity={0.9}>
              <Palm s={0.8 + r() * 0.3} />
            </g>
          ))}
        </>
      ),
    };
  },
  ground({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 562, 18, 520, 0)} style={fill("var(--c2)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 612, 14, 420, 120)} style={fill("var(--c3)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 670, 8, 300, 40)} style={fill("var(--c4)")} filter={EDGE} />
        </>
      ),
    };
  },
  front({ x0, x1 }) {
    return {
      bands: <path d={globalWavePath(x0, x1, 700, 9, 150, 0)} style={fill("var(--deep)")} />,
      items: scatter(x0, x1, 460, SEED + 4, (x, r, i) => (
        <g key={i} transform={`translate(${x} ${714 - r() * 6})`}>
          {i % 2 === 0 ? <Palm s={0.55} /> : <g transform="translate(0 -18) scale(0.7)"><Cactus /></g>}
        </g>
      )),
    };
  },
  stickers: {
    sky: [sticker("balloon", Balloon), sticker("plane", Plane), sticker("crescent", () => <Moon x={0} y={0} s={0.9} r={-20} fill="var(--cloud)" />)],
    side: [sticker("ticket", Ticket), sticker("compass", Compass), sticker("postcard", Postcard)],
    ground: [
      sticker("palm", () => (
        <g transform="translate(0 30) scale(0.62)">
          <Palm />
        </g>
      )),
      sticker("cactus", Cactus),
      sticker("rock", Rock),
    ],
  },
};
