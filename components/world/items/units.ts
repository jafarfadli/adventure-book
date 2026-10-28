/** Length in design units, resolved against the nearest --u (px per unit). */
export const u = (n: number) => `calc(var(--u) * ${n})`;

/** Centre of a point given relative to a rotated box's top-left, in station units. */
export function rotatedPoint(
  box: { x: number; y: number; w: number; h: number },
  rotDeg: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const ox = dx - box.w / 2;
  const oy = dy - box.h / 2;
  const r = (rotDeg * Math.PI) / 180;
  return { x: cx + ox * Math.cos(r) - oy * Math.sin(r), y: cy + ox * Math.sin(r) + oy * Math.cos(r) };
}

export const PAPER = "#fffdf8";
export const CARD_SHADOW = `${u(2)} ${u(5)} ${u(9)} rgba(30,16,20,0.32)`;
