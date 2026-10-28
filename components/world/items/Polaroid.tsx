import { cardBox, windowSize, type FrameSpec } from "@/lib/v2/templates";
import type { SlotV2 } from "@/lib/v2/types";
import type { Mount as MountKind } from "../themes";
import { Mount } from "./Mount";
import { PhotoWindow } from "./PhotoWindow";
import { CARD_SHADOW, PAPER, u } from "./units";

export function Polaroid({
  frame,
  slot,
  mount,
  lowRes,
}: {
  frame: FrameSpec;
  slot: SlotV2 | undefined;
  mount: MountKind;
  lowRes?: boolean;
}) {
  const box = cardBox(frame);
  const win = windowSize(frame);
  const capSize = box.w <= 200 ? 26 : 30;
  return (
    <figure
      data-slot={frame.key}
      className="absolute m-0"
      style={{
        left: u(box.x),
        top: u(box.y),
        width: u(box.w),
        height: u(box.h),
        padding: `${u(12)} ${u(12)} 0`,
        background: PAPER,
        boxShadow: CARD_SHADOW,
        transform: `rotate(${frame.rot}deg)`,
      }}
    >
      <PhotoWindow slot={slot} w={win.w} h={win.h} lowRes={lowRes} />
      <figcaption
        data-caption={frame.key}
        className="truncate px-1 text-center font-hand font-bold"
        style={{ height: u(46), lineHeight: u(46), fontSize: u(capSize), color: "var(--ink)" }}
      >
        {slot?.caption ?? ""}
      </figcaption>
      <Mount kind={mount} cardW={box.w} />
    </figure>
  );
}
