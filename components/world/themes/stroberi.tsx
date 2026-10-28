import { EDGE, LIFT } from "../art/defs";
import { Cloud, Heart } from "../art/pieces";
import { globalScallopPath, globalWavePath, scatter } from "@/lib/v2/shapes";
import { fill, stroke, type Sticker, type ThemeKit } from "./types";

// Stroberi · romantis — pink lace hills, hearts for a sun, strawberries and
// roses in the grass, love letters on the side.

const SEED = 101;

function Strawberry() {
  return (
    <g filter={LIFT}>
      <path d="M-22 -8 C-26 16 -8 34 0 36 C8 34 26 16 22 -8 C14 -16 -14 -16 -22 -8Z" style={fill("var(--c3)")} />
      <g style={fill("var(--paper)")}>
        <ellipse cx={-10} cy={2} rx={1.6} ry={2.6} />
        <ellipse cx={0} cy={-2} rx={1.6} ry={2.6} />
        <ellipse cx={10} cy={2} rx={1.6} ry={2.6} />
        <ellipse cx={-6} cy={14} rx={1.6} ry={2.6} />
        <ellipse cx={6} cy={14} rx={1.6} ry={2.6} />
        <ellipse cx={0} cy={25} rx={1.6} ry={2.6} />
      </g>
      <path d="M-16 -10 L-6 -14 L0 -22 L6 -14 L16 -10 L5 -6 L0 -2 L-5 -6Z" style={fill("var(--accent)")} />
      <rect x={-1.5} y={-30} width={3} height={9} rx={1.5} style={fill("var(--accent)")} />
    </g>
  );
}

function Rose() {
  return (
    <g filter={LIFT}>
      <ellipse cx={-17} cy={15} rx={11} ry={5} transform="rotate(-30 -17 15)" style={fill("var(--accent)")} />
      <ellipse cx={17} cy={16} rx={11} ry={5} transform="rotate(25 17 16)" style={fill("var(--accent)")} />
      <circle r={19} style={fill("var(--c3)")} />
      <path
        d="M-2 -1 a4 4 0 1 1 5 5 a8 8 0 1 1 -11 -11 a13 13 0 1 1 18 17"
        fill="none"
        style={stroke("var(--c4)")}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </g>
  );
}

function Envelope() {
  return (
    <g filter={LIFT}>
      <rect x={-27} y={-18} width={54} height={36} rx={3} style={fill("var(--cloud)")} />
      <path d="M-27 -18 L0 5 L27 -18" fill="none" style={stroke("var(--c2)")} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M0 11 C-11 3 -9 -7 0 -1 C9 -7 11 3 0 11Z" style={fill("var(--c3)")} />
    </g>
  );
}

function Cherry() {
  return (
    <g filter={LIFT}>
      <path d="M-8 6 C-6 -10 2 -20 10 -24 M12 8 C10 -8 8 -18 10 -24" fill="none" style={stroke("var(--c4)")} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M10 -24 C18 -30 26 -26 26 -20 C18 -18 14 -20 10 -24Z" style={fill("var(--accent)")} />
      <circle cx={-9} cy={14} r={11} style={fill("var(--c3)")} />
      <circle cx={13} cy={16} r={11} style={fill("var(--c4)")} />
      <circle cx={-12} cy={10} r={2.5} style={fill("var(--cloud)")} opacity={0.8} />
    </g>
  );
}

function Tulip() {
  return (
    <g filter={LIFT}>
      <path d="M0 30 C0 18 1 8 0 -4" fill="none" style={stroke("var(--accent)")} strokeWidth={3} strokeLinecap="round" />
      <path d="M0 22 C-12 14 -16 6 -14 -2 C-8 4 -4 10 0 22Z" style={fill("var(--accent)")} />
      <path d="M-13 -24 L-6 -12 L0 -26 L6 -12 L13 -24 C16 -6 10 4 0 4 C-10 4 -16 -6 -13 -24Z" style={fill("var(--c3)")} />
    </g>
  );
}

const sticker = (name: string, draw: () => React.ReactNode): Sticker => ({ name, draw });

export const stroberi: ThemeKit = {
  key: "stroberi",
  mount: "bow",
  sky({ x0, x1, top }) {
    return {
      items: (
        <>
          {scatter(x0, x1, 1500, SEED, (x, r, i) => (
            <Heart key={`sun${i}`} x={x} y={130 + r() * 50} s={2.4} r={(r() - 0.5) * 16} fill="var(--c2)" />
          ))}
          {scatter(x0, x1, 300, SEED + 1, (x, r, i) => (
            <Cloud key={`c${i}`} x={x} y={60 + r() * 190} s={0.55 + r() * 0.5} />
          ))}
          {scatter(x0, x1, 410, SEED + 2, (x, r, i) => (
            <Heart
              key={`h${i}`}
              x={x}
              y={40 + r() * 260}
              s={0.4 + r() * 0.3}
              r={(r() - 0.5) * 30}
              fill={r() > 0.5 ? "var(--c3)" : "var(--c2)"}
            />
          ))}
          {top < -40 &&
            scatter(x0, x1, 260, SEED + 3, (x, r, i) => (
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
          <path d={globalWavePath(x0, x1, 462, 30, 380, 40)} style={fill("var(--c1)")} filter={EDGE} />
          <path d={globalScallopPath(x0, x1, 512, 24)} style={fill("var(--c2)")} opacity={0.85} filter={EDGE} />
        </>
      ),
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
      items: scatter(x0, x1, 430, SEED + 4, (x, r, i) => (
        <g key={i} transform={`translate(${x} ${696 - r() * 6}) rotate(${(r() - 0.5) * 20}) scale(0.7)`}>
          {i % 2 === 0 ? <Strawberry /> : <Tulip />}
        </g>
      )),
    };
  },
  stickers: {
    sky: [
      sticker("heart", () => <Heart x={0} y={0} s={1.5} fill="var(--c3)" />),
      sticker("cloud", () => <Cloud x={4} y={0} s={0.62} />),
      sticker("hearts", () => (
        <>
          <Heart x={-10} y={-6} s={1} fill="var(--c2)" r={-12} />
          <Heart x={12} y={8} s={0.7} fill="var(--c3)" r={14} />
        </>
      )),
    ],
    side: [sticker("envelope", Envelope), sticker("rose", Rose), sticker("cherry", Cherry)],
    ground: [
      sticker("strawberry", Strawberry),
      sticker("strawberries", () => (
        <>
          <g transform="translate(-12 0) rotate(-10) scale(0.85)">
            <Strawberry />
          </g>
          <g transform="translate(16 8) rotate(12) scale(0.6)">
            <Strawberry />
          </g>
        </>
      )),
      sticker("tulip", Tulip),
    ],
  },
};
