import { frameBox, toFrameFormat } from "@/lib/frames";
import { TAPE_STYLES } from "@/lib/tapes";
import type { SlotData } from "@/lib/types";

export function PolaroidFrame({
  slot,
  size,
  maxHeight,
  className = "",
}: {
  slot: SlotData;
  /** Optical size from the FRAME_SIZE scale — not a width (see frameBox). */
  size: number;
  /** Layout's height ceiling, so a portrait frame can't outgrow the page. */
  maxHeight?: number;
  /** Positioning only — the box comes from size + format. */
  className?: string;
}) {
  const alt = slot.caption || "foto kenangan";
  const format = toFrameFormat(slot.aspect);
  const { width, height } = frameBox(size, format, maxHeight);
  const tape = slot.tapeStyle
    ? (TAPE_STYLES[slot.tapeStyle] ?? TAPE_STYLES.classic).className
    : null;
  // A polaroid's border is thinner on a narrow frame, so a portrait strip
  // doesn't look like it's drowning in white.
  const pad = format === "portrait" ? 8 : 12;

  return (
    <figure
      className={`relative max-w-full bg-white shadow-xl shadow-black/20 ${className}`}
      style={{
        width: width + pad * 2,
        paddingInline: pad,
        paddingTop: pad,
        paddingBottom: pad * 0.7,
        transform: `rotate(${slot.rotation}deg)`,
      }}
    >
      {tape && (
        <span
          aria-hidden
          className={`absolute -top-3 left-1/2 h-7 w-1/2 -translate-x-1/2 -rotate-2 ${tape} shadow-sm backdrop-blur-[1px]`}
        />
      )}
      {slot.imageUrl ? (
        // Served via /api/media (dynamic, outside /public) — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.imageUrl}
          alt={alt}
          className="w-full bg-stone-100 object-cover"
          style={{ height }}
        />
      ) : (
        <div
          className="flex w-full items-center justify-center border-2 border-dashed border-stone-300 bg-stone-50"
          style={{ height }}
        >
          <span className="font-hand text-lg text-stone-400">belum ada foto</span>
        </div>
      )}
      {(slot.caption || slot.dateLabel) && (
        <figcaption className="px-1 pt-2 pb-1 text-center">
          {slot.caption && (
            <span className="font-hand text-2xl leading-tight text-stone-700">
              {slot.caption}
            </span>
          )}
          {slot.dateLabel && (
            <span className="mt-0.5 block font-hand text-lg text-stone-400">
              {slot.dateLabel}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
