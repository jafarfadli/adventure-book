import { u } from "./units";

/** Round date stamp with a dashed inner ring, in the theme's deep colour. */
export function Stamp({ x, y, day, year }: { x: number; y: number; day: string; year: string }) {
  const free = !year; // free-text label ("malam minggu"): smaller, may wrap
  return (
    <div
      className="pointer-events-none absolute grid place-content-center text-center font-hand leading-none"
      style={{
        left: u(x - 33),
        top: u(y - 33),
        width: u(66),
        height: u(66),
        borderRadius: "50%",
        background: "var(--c3)",
        color: "var(--paper)",
        transform: "rotate(10deg)",
        boxShadow: `inset 0 0 0 ${u(5)} var(--c3), inset 0 0 0 ${u(6.5)} rgba(255,255,255,0.72), ${u(2)} ${u(4)} ${u(6)} rgba(30,16,20,0.3)`,
        padding: u(8),
      }}
    >
      <span className="font-bold" style={{ fontSize: u(free ? 14 : 17) }}>
        {day}
      </span>
      {year && <span style={{ fontSize: u(13), marginTop: u(3) }}>{year}</span>}
    </div>
  );
}

/** Small paper tag carrying the place name. */
export function PlaceTag({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div
      className="pointer-events-none absolute flex max-w-[60%] items-center gap-[0.25em] truncate font-hand font-bold"
      style={{
        left: u(x),
        top: u(y),
        fontSize: u(18),
        padding: `${u(3)} ${u(10)} ${u(3)} ${u(8)}`,
        background: "var(--paper)",
        color: "var(--c4)",
        borderRadius: u(6),
        transform: "rotate(-4deg)",
        boxShadow: `${u(1)} ${u(3)} ${u(5)} rgba(30,16,20,0.25)`,
      }}
    >
      <svg viewBox="0 0 24 24" style={{ width: u(15), height: u(15), flex: "none" }} fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M12 21 C12 21 5.5 14.8 5.5 9.8 A6.5 6.5 0 0 1 18.5 9.8 C18.5 14.8 12 21 12 21 Z" />
      </svg>
      <span className="truncate">{label}</span>
    </div>
  );
}
