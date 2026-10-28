import type { Mount as MountKind } from "../themes";
import { u } from "./units";

// How a card is stuck to the page, per theme: a ribbon bow (Stroberi), kraft
// tape (Senja), two corner tapes (Matcha), striped tape (Laut), dotted tape
// (Lavender). Drawn inside the card so it rotates with it.

const TAPE_W = 88;
const TAPE_H = 24;

function Tape({ background, rot, left, top, width = TAPE_W }: { background: string; rot: number; left: string; top: string; width?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        width: u(width),
        height: u(TAPE_H),
        background,
        opacity: 0.9,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        boxShadow: `0 ${u(1)} ${u(2)} rgba(30,16,20,0.15)`,
      }}
    />
  );
}

export function Mount({ kind, cardW }: { kind: MountKind; cardW: number }) {
  if (kind === "bow") {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute overflow-visible"
        style={{ left: "50%", top: u(-20), width: u(68), height: u(50), transform: "translateX(-50%)" }}
        viewBox="-34 -18 68 50"
      >
        <g style={{ filter: "drop-shadow(1px 2px 1.5px rgba(30,16,20,.3))" }}>
          <path d="M-3 3 L-15 27 L-8 25 L-4 31 L3 5Z M3 3 L15 27 L8 25 L4 31 L-3 5Z" style={{ fill: "var(--c3)" }} />
          <path d="M0 0 C-10 -15 -32 -13 -30 0 C-32 13 -10 15 0 0Z M0 0 C10 -15 32 -13 30 0 C32 13 10 15 0 0Z" style={{ fill: "var(--c3)" }} />
          <circle r={6.5} style={{ fill: "var(--c4)" }} />
        </g>
      </svg>
    );
  }
  if (kind === "corners") {
    return (
      <>
        <Tape background="var(--accent)" rot={-40} left={u(14)} top={u(-6)} width={64} />
        <Tape background="var(--accent)" rot={40} left={u(cardW - 14)} top={u(-6)} width={64} />
      </>
    );
  }
  const background =
    kind === "kraft"
      ? "#d8b98a"
      : kind === "stripes"
        ? `repeating-linear-gradient(90deg, var(--c2) 0 ${u(10)}, var(--cloud) ${u(10)} ${u(16)})`
        : `radial-gradient(circle, var(--accent) 0 ${u(2.6)}, transparent ${u(3)}) 0 0 / ${u(14)} ${u(12)}, var(--c2)`;
  return <Tape background={background} rot={kind === "kraft" ? -3 : 3} left="50%" top={u(-12)} />;
}
