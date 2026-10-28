import { EDGE, LIFT } from "../art/defs";
import { Cloud, Star5 } from "../art/pieces";
import { globalWavePath, scatter } from "@/lib/v2/shapes";
import { fill, stroke, type Sticker, type ThemeKit } from "./types";

// Laut · liburan — snow-capped mountains over layered waves, a big orange sun,
// paper boats, shells and gulls.

const SEED = 404;

function Gull() {
  return (
    <path d="M-16 0 C -10 -8 -4 -8 0 0 C 4 -8 10 -8 16 0" fill="none" style={stroke("var(--c4)")} strokeWidth={2.6} strokeLinecap="round" />
  );
}

function Boat() {
  return (
    <g filter={LIFT}>
      <path d="M-34 0 H34 L22 16 H-22Z" style={fill("var(--cloud)")} />
      <path d="M-2 -2 V-34 L22 -2Z" style={fill("var(--accent)")} />
      <path d="M-6 -2 L-26 -2 L-6 -26Z" style={fill("var(--cloud)")} />
    </g>
  );
}

function Shell() {
  return (
    <g filter={LIFT}>
      <path d="M0 18 L-24 -2 C -22 -20 22 -20 24 -2Z" style={fill("var(--cloud)")} />
      <path d="M0 18 L-14 -14 M0 18 L-5 -18 M0 18 L5 -18 M0 18 L14 -14" style={stroke("var(--c2)")} strokeWidth={1.8} />
      <rect x={-7} y={15} width={14} height={6} rx={2} style={fill("var(--cloud)")} />
    </g>
  );
}

function Fish() {
  return (
    <g filter={LIFT}>
      <path d="M-24 0 C -12 -16 12 -16 20 0 C 12 16 -12 16 -24 0Z" style={fill("var(--c2)")} />
      <path d="M18 0 L32 -12 L30 0 L32 12Z" style={fill("var(--accent)")} />
      <circle cx={-12} cy={-3} r={2.6} style={fill("var(--c4)")} />
      <path d="M-2 -8 C 2 -2 2 2 -2 8" fill="none" style={stroke("var(--c1)")} strokeWidth={1.8} />
    </g>
  );
}

function Buoy() {
  return (
    <g filter={LIFT}>
      <circle r={22} style={fill("var(--accent)")} />
      <circle r={10} style={fill("var(--paper)")} />
      <g style={fill("var(--cloud)")}>
        <path d="M-6 -21.2 A22 22 0 0 1 6 -21.2 L3 -9.5 A10 10 0 0 0 -3 -9.5Z" />
        <path d="M-6 21.2 A22 22 0 0 0 6 21.2 L3 9.5 A10 10 0 0 1 -3 9.5Z" />
        <path d="M-21.2 -6 A22 22 0 0 0 -21.2 6 L-9.5 3 A10 10 0 0 1 -9.5 -3Z" />
        <path d="M21.2 -6 A22 22 0 0 1 21.2 6 L9.5 3 A10 10 0 0 0 9.5 -3Z" />
      </g>
    </g>
  );
}

function Lighthouse() {
  return (
    <g filter={LIFT}>
      <path d="M-10 30 L-7 -16 H7 L10 30Z" style={fill("var(--cloud)")} />
      <path d="M-9 14 H9 L9.6 22 H-9.6Z M-8 -2 H8 L8.5 6 H-8.5Z" style={fill("var(--c3)")} />
      <rect x={-9} y={-26} width={18} height={10} rx={2} style={fill("var(--accent)")} />
      <path d="M-11 -26 L0 -36 L11 -26Z" style={fill("var(--c4)")} />
    </g>
  );
}

function Mountain({ x, s }: { x: number; s: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d={`M${-130 * s} 500 L0 ${500 - 190 * s} L${130 * s} 500Z`} style={fill("var(--c3)")} filter={LIFT} />
      <path
        d={`M${-25 * s} ${500 - 152 * s} L0 ${500 - 190 * s} L${26 * s} ${500 - 150 * s} L${12 * s} ${500 - 156 * s} L0 ${500 - 134 * s} L${-10 * s} ${500 - 154 * s}Z`}
        style={fill("var(--cloud)")}
      />
    </g>
  );
}

const sticker = (name: string, draw: () => React.ReactNode): Sticker => ({ name, draw });

export const laut: ThemeKit = {
  key: "laut",
  mount: "stripes",
  sky({ x0, x1, top }) {
    return {
      items: (
        <>
          {scatter(x0, x1, 1600, SEED, (x, r, i) => (
            <g key={`sun${i}`} filter={LIFT}>
              <circle cx={x} cy={190 + r() * 40} r={82} style={fill("var(--accent)")} />
            </g>
          ))}
          {scatter(x0, x1, 300, SEED + 1, (x, r, i) => (
            <Cloud key={`c${i}`} x={x} y={60 + r() * 170} s={0.55 + r() * 0.5} />
          ))}
          {scatter(x0, x1, 520, SEED + 2, (x, r, i) => (
            <g key={`g${i}`} transform={`translate(${x} ${180 + r() * 140}) scale(${0.6 + r() * 0.5})`}>
              <Gull />
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
          <path d={globalWavePath(x0, x1, 500, 10, 110, 0)} style={fill("var(--c1)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 532, 8, 90, 30)} style={fill("var(--c2)")} opacity={0.9} filter={EDGE} />
        </>
      ),
      items: scatter(x0, x1, 1300, SEED + 6, (x, r, i) => <Mountain key={i} x={x} s={0.9 + r() * 0.4} />),
    };
  },
  ground({ x0, x1 }) {
    return {
      bands: (
        <>
          <path d={globalWavePath(x0, x1, 566, 12, 140, 0)} style={fill("var(--c2)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 606, 12, 120, 40)} style={fill("var(--c3)")} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 648, 10, 100, 10)} style={fill("var(--c3)")} opacity={0.85} filter={EDGE} />
          <path d={globalWavePath(x0, x1, 680, 8, 90, 60)} style={fill("var(--c4)")} filter={EDGE} />
        </>
      ),
    };
  },
  front({ x0, x1 }) {
    return {
      bands: <path d={globalWavePath(x0, x1, 702, 8, 120, 0)} style={fill("var(--deep)")} />,
      items: scatter(x0, x1, 420, SEED + 4, (x, r, i) => (
        <g key={i} transform={`translate(${x} ${700 - r() * 6}) rotate(${(r() - 0.5) * 30}) scale(0.6)`}>
          {i % 2 === 0 ? <Shell /> : <Star5 x={0} y={0} s={0.8} />}
        </g>
      )),
    };
  },
  stickers: {
    sky: [
      sticker("gull", () => (
        <g transform="scale(1.4)">
          <Gull />
        </g>
      )),
      sticker("cloud", () => <Cloud x={4} y={0} s={0.62} />),
      sticker("sun", () => (
        <g filter={LIFT}>
          <circle r={22} style={fill("var(--accent)")} />
        </g>
      )),
    ],
    side: [sticker("boat", Boat), sticker("fish", Fish), sticker("buoy", Buoy)],
    ground: [
      sticker("shell", Shell),
      sticker("starfish", () => <Star5 x={0} y={0} s={1} />),
      sticker("lighthouse", Lighthouse),
    ],
  },
};
