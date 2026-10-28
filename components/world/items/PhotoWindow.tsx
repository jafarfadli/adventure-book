import { Icon } from "@/components/v2/Icon";
import type { SlotV2 } from "@/lib/v2/types";
import { u } from "./units";

/** The photo itself, cropped by its focal point; a paper placeholder when empty. */
export function PhotoWindow({ slot, w, h, lowRes }: { slot: SlotV2 | undefined; w: number; h: number; lowRes?: boolean }) {
  const src = slot ? (lowRes ? (slot.thumbUrl ?? slot.imageUrl) : slot.imageUrl) : null;
  return (
    <div className="relative overflow-hidden" style={{ width: u(w), height: u(h), background: "#ece6e2" }}>
      {src ? (
        // Served via /api/media (outside /public) — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={slot?.caption || "foto kenangan"}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-full w-full select-none object-cover"
          style={{ objectPosition: `${(slot!.focusX * 100).toFixed(1)}% ${(slot!.focusY * 100).toFixed(1)}%` }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[#b9aeb2]">
          <Icon name="photos" className="h-1/4 w-1/4" />
        </div>
      )}
    </div>
  );
}
