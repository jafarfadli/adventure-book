import { TAPE_STYLES } from "@/lib/tapes";
import type { SlotData } from "@/lib/types";

export function PolaroidFrame({
  slot,
  className = "max-w-72",
}: {
  slot: SlotData;
  /** Must set the frame's max width (e.g. "max-w-44") — no baked-in default,
   *  so callers' size classes never fight a base max-w utility. */
  className?: string;
}) {
  const alt = slot.caption || "foto kenangan";
  const tape = slot.tapeStyle
    ? (TAPE_STYLES[slot.tapeStyle] ?? TAPE_STYLES.classic).className
    : null;

  return (
    <figure
      className={`relative w-full bg-white p-3 pb-2 shadow-xl shadow-black/20 ${className}`}
      style={{ transform: `rotate(${slot.rotation}deg)` }}
    >
      {tape && (
        <span
          aria-hidden
          className={`absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-2 ${tape} shadow-sm backdrop-blur-[1px]`}
        />
      )}
      {slot.imageUrl ? (
        // Served via /api/media (dynamic, outside /public) — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slot.imageUrl}
          alt={alt}
          className="aspect-square w-full bg-stone-100 object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center border-2 border-dashed border-stone-300 bg-stone-50">
          <span className="font-hand text-xl text-stone-400">belum ada foto</span>
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
