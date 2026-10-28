import { stripBox, type FrameSpec, type StripSpec } from "@/lib/v2/templates";
import type { SlotV2 } from "@/lib/v2/types";
import type { Mount as MountKind } from "../themes";
import type { TextEdit } from "./edit-types";
import { InlineInput } from "./EditText";
import { Mount } from "./Mount";
import { PhotoWindow, type FocusDrag } from "./PhotoWindow";
import { CARD_SHADOW, PAPER, u } from "./units";

/** Photobooth strip: three square shots on one paper strip, footer = photo1's caption. */
export function Strip({
  strip,
  frames,
  slots,
  mount,
  lowRes,
  caption,
  focus,
}: {
  strip: StripSpec;
  frames: FrameSpec[];
  slots: Record<string, SlotV2>;
  mount: MountKind;
  lowRes?: boolean;
  caption?: TextEdit;
  focus?: (key: string) => FocusDrag | undefined;
}) {
  const box = stripBox(strip);
  const footStyle = { height: u(40), lineHeight: u(40), fontSize: u(22), color: "var(--c3)" };
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
          <PhotoWindow slot={slots[f.key]} w={f.w} h={f.w} lowRes={lowRes} focus={focus?.(f.key)} />
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 px-2">
        {caption?.typing ? (
          <InlineInput
            label="Caption"
            value={slots.photo1?.caption ?? ""}
            onChange={caption.onType}
            onDone={caption.onDone}
            className="text-center font-hand font-bold"
            style={footStyle}
          />
        ) : (
          <div data-caption="photo1" className="truncate text-center font-hand font-bold" style={footStyle}>
            {slots.photo1?.caption ?? ""}
          </div>
        )}
      </div>
      <Mount kind={mount} cardW={box.w} />
    </div>
  );
}
