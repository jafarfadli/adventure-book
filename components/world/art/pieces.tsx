import { LIFT } from "./defs";

// Generic cut-paper pieces shared by every theme kit. Each is drawn around
// (0,0) in design units; callers place them with x/y/scale/rot and pass a
// colour (usually a theme CSS variable such as "var(--cloud)").

type Place = { x: number; y: number; s?: number; r?: number; fill?: string; shadow?: boolean; opacity?: number };

export function at({ x, y, s = 1, r = 0 }: Place): string {
  return `translate(${x} ${y})${r ? ` rotate(${r})` : ""}${s !== 1 ? ` scale(${s})` : ""}`;
}

function G({ p, children }: { p: Place; children: React.ReactNode }) {
  return (
    <g transform={at(p)} fill={p.fill} filter={p.shadow === false ? undefined : LIFT} opacity={p.opacity}>
      {children}
    </g>
  );
}

export function Cloud(p: Place) {
  return (
    <G p={{ fill: "var(--cloud)", ...p }}>
      <circle cx={-30} cy={6} r={16} />
      <circle cx={-8} cy={-5} r={22} />
      <circle cx={18} cy={4} r={15} />
      <rect x={-46} y={6} width={80} height={16} rx={8} />
    </G>
  );
}

export function Heart(p: Place) {
  return (
    <G p={{ fill: "var(--c3)", ...p }}>
      <path d="M0 14 C-22 -2 -18 -22 0 -10 C18 -22 22 -2 0 14Z" />
    </G>
  );
}

export function Star5(p: Place) {
  return (
    <G p={{ fill: "var(--accent)", ...p }}>
      <path
        d="M0 -24 L5.9 -8.1 L22.8 -7.4 L9.5 3.1 L14.1 19.4 L0 10 L-14.1 19.4 L-9.5 3.1 L-22.8 -7.4 L-5.9 -8.1Z"
        stroke={p.fill ?? "var(--accent)"}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </G>
  );
}

/** Four-point twinkle. */
export function Star4(p: Place) {
  return (
    <G p={{ fill: "var(--accent)", shadow: false, ...p }}>
      <path d="M0 -10 Q0 0 10 0 Q0 0 0 10 Q0 0 -10 0 Q0 0 0 -10Z" />
    </G>
  );
}

export function Moon(p: Place) {
  return (
    <G p={{ fill: "var(--accent)", ...p }}>
      <path d="M8 -26 A27 27 0 1 0 8 26 A21 21 0 1 1 8 -26Z" />
    </G>
  );
}

export function Sun(p: Place & { radius?: number }) {
  return (
    <G p={{ fill: "var(--accent)", ...p }}>
      <circle r={p.radius ?? 60} />
    </G>
  );
}

/** Seam cover where two themes meet: left half in one palette, right in the next. */
export function Bush({ x, y, left, right, deep }: { x: number; y: number; left: string; right: string; deep: string }) {
  return (
    <g filter={LIFT}>
      <circle cx={x - 46} cy={y + 10} r={40} fill={left} />
      <circle cx={x} cy={y - 12} r={54} fill={right} />
      <circle cx={x + 50} cy={y + 8} r={42} fill={deep} />
    </g>
  );
}
