import { stripBox, type FrameSpec, type StripSpec } from "@/lib/v2/templates";
import type { SlotV2 } from "@/lib/v2/types";
import type { Mount as MountKind } from "../themes";
import { Mount } from "./Mount";
import { PhotoWindow } from "./PhotoWindow";
import { CARD_SHADOW, PAPER, u } from "./units";

/** Photobooth strip: three square shots on one paper strip, footer = photo1's caption. */
export function Strip({
  strip,
  frames,
  slots,
  mount,
  lowRes,
}: {
  strip: StripSpec;
  frames: FrameSpec[];
  slots: Record<string, SlotV2>;
  mount: MountKind;
  lowRes?: boolean;
}) {
  const box = stripBox(strip);
  return (
    <div
      className="absolute"
      style={{
        left: u(box.x),
        top: u(box.y),
        width: u(box.w),
        height: u(box.h),
        background: PAPER,
        boxShadow: CARD_SHADOW,
        transform: `rotate(${strip.rot}deg)`,
      }}
    >
      {frames.map((f) => (
        <div key={f.key} data-slot={f.key} className="absolute" style={{ left: u(f.x - box.x), top: u(f.y - box.y) }}>
          <PhotoWindow slot={slots[f.key]} w={f.w} h={f.w} lowRes={lowRes} />
        </div>
      ))}
      <div
        data-caption="photo1"
        className="absolute inset-x-0 bottom-0 truncate px-2 text-center font-hand font-bold"
        style={{ height: u(40), lineHeight: u(40), fontSize: u(22), color: "var(--c3)" }}
      >
        {slots.photo1?.caption ?? ""}
      </div>
      <Mount kind={mount} cardW={box.w} />
    </div>
  );
}
