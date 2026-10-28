import { LETTER_POCKET, type TextSpec } from "@/lib/v2/templates";
import type { Mount as MountKind } from "../themes";
import type { TextEdit } from "./edit-types";
import { InlineArea } from "./EditText";
import { Mount } from "./Mount";
import { CARD_SHADOW, PAPER, u } from "./units";

// Text slots: a lined note, a letter sticking out of its envelope, or a quote
// on a paper cloud. Fixed font sizes; long text is clamped, never shrunk.

const clamp = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

export function Note({ spec, text, mount, edit }: { spec: TextSpec; text: string | null; mount: MountKind; edit?: TextEdit }) {
  const line = 30;
  const font = { fontSize: u(18), lineHeight: u(line), color: "var(--ink)" };
  return (
    <div
      className="absolute"
      style={{
        left: u(spec.x),
        top: u(spec.y),
        width: u(spec.w),
        height: u(spec.h),
        background: `repeating-linear-gradient(to bottom, ${PAPER} 0 ${u(line - 1)}, var(--c1) ${u(line - 1)} ${u(line)})`,
        backgroundPosition: `0 ${u(18 + 4)}`,
        backgroundColor: PAPER,
        boxShadow: CARD_SHADOW,
        transform: `rotate(${spec.rot}deg)`,
        padding: `${u(18)} ${u(18)} ${u(12)}`,
      }}
    >
      {edit?.typing ? (
        <InlineArea label="Cerita" value={text ?? ""} onChange={edit.onType} onDone={edit.onDone} className="font-hand-alt" style={font} />
      ) : (
        <p data-text="text1" className="m-0 h-full whitespace-pre-wrap font-hand-alt" style={{ ...font, ...clamp(spec.maxLines) }}>
          {text ?? ""}
        </p>
      )}
      <Mount kind={mount === "bow" ? "dots" : mount} cardW={spec.w} />
    </div>
  );
}

export function Letter({ spec, text, edit }: { spec: TextSpec; text: string | null; edit?: TextEdit }) {
  const line = 34;
  const font = { fontSize: u(19), lineHeight: u(line), color: "var(--ink)" };
  return (
    <>
      <div
        className="absolute"
        style={{
          left: u(spec.x),
          top: u(spec.y),
          width: u(spec.w),
          height: u(spec.h),
          backgroundColor: PAPER,
          backgroundImage: `linear-gradient(to right, transparent ${u(46)}, var(--c2) ${u(46)} ${u(47.5)}, transparent ${u(47.5)}), repeating-linear-gradient(to bottom, transparent 0 ${u(line - 1)}, var(--c1) ${u(line - 1)} ${u(line)})`,
          backgroundPosition: `0 0, 0 ${u(46)}`,
          boxShadow: CARD_SHADOW,
          transform: `rotate(${spec.rot}deg)`,
          padding: `${u(42)} ${u(22)} ${u(16)} ${u(60)}`,
        }}
      >
        {edit?.typing ? (
          <InlineArea label="Isi surat" value={text ?? ""} onChange={edit.onType} onDone={edit.onDone} className="font-hand-alt" style={font} />
        ) : (
          <p data-text="text1" className="m-0 h-full whitespace-pre-wrap font-hand-alt" style={{ ...font, ...clamp(spec.maxLines) }}>
            {text ?? ""}
          </p>
        )}
      </div>
      <svg
        aria-hidden
        className="pointer-events-none absolute overflow-visible"
        style={{
          left: u(spec.x + LETTER_POCKET.dx),
          top: u(spec.y + LETTER_POCKET.dy),
          width: u(LETTER_POCKET.w),
          height: u(LETTER_POCKET.h),
        }}
        viewBox={`0 0 ${LETTER_POCKET.w} ${LETTER_POCKET.h}`}
      >
        <path d={`M0 0 L${LETTER_POCKET.w / 2} 80 L${LETTER_POCKET.w} 0 V${LETTER_POCKET.h} H0Z`} style={{ fill: "var(--c2)" }} filter="url(#ab-edge)" />
        <path d={`M0 ${LETTER_POCKET.h} L${LETTER_POCKET.w / 2} 70 L${LETTER_POCKET.w} ${LETTER_POCKET.h}`} fill="none" style={{ stroke: "var(--c3)" }} strokeWidth={2} opacity={0.6} />
        <path
          d={`M${LETTER_POCKET.w / 2} 98 C ${LETTER_POCKET.w / 2 - 18} 84 ${LETTER_POCKET.w / 2 - 14} 68 ${LETTER_POCKET.w / 2} 78 C ${LETTER_POCKET.w / 2 + 14} 68 ${LETTER_POCKET.w / 2 + 18} 84 ${LETTER_POCKET.w / 2} 98Z`}
          style={{ fill: "var(--c4)" }}
          filter="url(#ab-lift)"
        />
      </svg>
    </>
  );
}

export function Quote({ spec, text, edit }: { spec: TextSpec; text: string | null; edit?: TextEdit }) {
  const font = { fontSize: u(46), lineHeight: 1.08, color: "var(--c4)" };
  return (
    <div className="absolute" style={{ left: u(spec.x), top: u(spec.y), width: u(spec.w), height: u(spec.h) }}>
      <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 400 260">
        <g style={{ fill: "var(--cloud)" }} filter="url(#ab-lift)">
          <circle cx={110} cy={130} r={80} />
          <circle cx={200} cy={92} r={100} />
          <circle cx={290} cy={130} r={80} />
          <circle cx={156} cy={176} r={70} />
          <circle cx={252} cy={180} r={70} />
          <rect x={40} y={130} width={320} height={104} rx={52} />
        </g>
        <text x={78} y={70} fontSize={80} fontWeight={700} style={{ fill: "var(--accent)", fontFamily: "var(--font-caveat)" }}>
          &ldquo;
        </text>
      </svg>
      {edit?.typing ? (
        <div className="absolute" style={{ inset: `${u(60)} ${u(56)} ${u(30)}` }}>
          <InlineArea label="Kutipan" value={text ?? ""} onChange={edit.onType} onDone={edit.onDone} className="text-center font-hand font-bold" style={font} />
        </div>
      ) : (
        <p
          data-text="text1"
          className="absolute m-0 grid place-items-center text-center font-hand font-bold whitespace-pre-wrap"
          style={{ inset: `${u(50)} ${u(56)} ${u(30)}`, ...font, ...clamp(spec.maxLines) }}
        >
          {text ?? ""}
        </p>
      )}
    </div>
  );
}
