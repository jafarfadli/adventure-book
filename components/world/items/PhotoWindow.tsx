"use client";

import { useRef } from "react";
import { Icon } from "@/components/v2/Icon";
import type { SlotV2 } from "@/lib/v2/types";
import { u } from "./units";

export type FocusDrag = { active: boolean; onFocus: (x: number, y: number, done: boolean) => void };

/**
 * The photo itself, cropped by its focal point; a paper placeholder when
 * empty. In focus mode the photo can be dragged inside its frame to choose
 * which part shows (it follows the finger).
 */
export function PhotoWindow({
  slot,
  w,
  h,
  lowRes,
  focus,
}: {
  slot: SlotV2 | undefined;
  w: number;
  h: number;
  lowRes?: boolean;
  focus?: FocusDrag;
}) {
  const src = slot ? (lowRes ? (slot.thumbUrl ?? slot.imageUrl) : slot.imageUrl) : null;
  const drag = useRef<{ x: number; y: number; fx: number; fy: number; ox: number; oy: number } | null>(null);

  // how far the cropped image overflows the window, in px, along each axis
  function overflow(box: DOMRect): { ox: number; oy: number } {
    const nw = slot?.width ?? 0;
    const nh = slot?.height ?? 0;
    if (!nw || !nh) return { ox: box.width * 0.3, oy: box.height * 0.3 };
    const k = Math.max(box.width / nw, box.height / nh);
    return { ox: Math.max(0, nw * k - box.width), oy: Math.max(0, nh * k - box.height) };
  }

  const active = focus?.active && slot?.imageUrl;
  return (
    <div
      className={`relative overflow-hidden ${active ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
      style={{ width: u(w), height: u(h), background: "#ece6e2" }}
      onPointerDown={
        active
          ? (e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const { ox, oy } = overflow(e.currentTarget.getBoundingClientRect());
              drag.current = { x: e.clientX, y: e.clientY, fx: slot!.focusX, fy: slot!.focusY, ox, oy };
            }
          : undefined
      }
      onPointerMove={
        active
          ? (e) => {
              const d = drag.current;
              if (!d) return;
              const fx = d.ox ? Math.min(1, Math.max(0, d.fx - (e.clientX - d.x) / d.ox)) : d.fx;
              const fy = d.oy ? Math.min(1, Math.max(0, d.fy - (e.clientY - d.y) / d.oy)) : d.fy;
              focus!.onFocus(fx, fy, false);
            }
          : undefined
      }
      onPointerUp={
        active
          ? (e) => {
              const d = drag.current;
              drag.current = null;
              if (!d) return;
              const fx = d.ox ? Math.min(1, Math.max(0, d.fx - (e.clientX - d.x) / d.ox)) : d.fx;
              const fy = d.oy ? Math.min(1, Math.max(0, d.fy - (e.clientY - d.y) / d.oy)) : d.fy;
              focus!.onFocus(fx, fy, true);
            }
          : undefined
      }
    >
      {src ? (
        // Served via /api/media (outside /public) — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={slot?.caption || "foto kenangan"}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none block h-full w-full select-none object-cover"
          style={{ objectPosition: `${(slot!.focusX * 100).toFixed(1)}% ${(slot!.focusY * 100).toFixed(1)}%` }}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[#b9aeb2]">
          <Icon name="photos" className="h-1/4 w-1/4" />
        </div>
      )}
      {active && (
        <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-white drop-shadow">
          <Icon name="focus" className="h-1/5 w-1/5" />
        </span>
      )}
    </div>
  );
}
