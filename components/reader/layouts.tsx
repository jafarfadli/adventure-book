import type { PageData, SlotData } from "@/lib/types";
import type { Theme } from "@/lib/themes";
import { FilmFrame } from "./FilmFrame";
import { PolaroidFrame } from "./PolaroidFrame";

// One small renderer per Layout value, selected by renderLayout(). The same
// components back the editor preview — keep them presentation-only.
//
// Pages are FIXED size (no scrolling): multi-photo layouts shrink their
// polaroids and stagger them left/right with slight overlaps, scrapbook
// style, and long text is line-clamped so nothing overflows the paper.
// Container queries (@xl) adapt to the page's own width, not the viewport.

export type BookMeta = { title: string; subtitle: string | null };
type LayoutProps = { slots: Record<string, SlotData>; book: BookMeta; theme: Theme };

function slotMap(page: PageData): Record<string, SlotData> {
  return Object.fromEntries(page.slots.map((s) => [s.key, s]));
}

function TextBlock({
  slot,
  theme,
  className = "",
}: {
  slot?: SlotData;
  theme: Theme;
  className?: string;
}) {
  if (!slot?.text) return null;
  return (
    <p
      className={`whitespace-pre-wrap font-hand-alt text-lg leading-relaxed ${theme.ink} ${className}`}
    >
      {slot.text}
    </p>
  );
}

// Rendered on a pink book-cover surface (bg set by the page container),
// so it styles itself as a decorated front cover, not a paper page.
function LayoutCover({ slots, book }: LayoutProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-white/60"
      />
      <span aria-hidden className="absolute top-5 left-7 -rotate-12 font-hand text-3xl text-white/70">
        ✦
      </span>
      <span aria-hidden className="absolute top-9 right-7 rotate-12 font-hand text-4xl text-white/70">
        ♡
      </span>
      <span aria-hidden className="absolute bottom-7 left-9 rotate-6 font-hand text-3xl text-white/70">
        ❀
      </span>
      <span aria-hidden className="absolute right-8 bottom-9 -rotate-6 font-hand text-2xl text-white/70">
        ⋆｡˚
      </span>
      <h1 className="font-hand text-5xl drop-shadow-sm md:text-6xl">{book.title}</h1>
      {book.subtitle && (
        <p className="font-hand-alt text-xl text-white/90">{book.subtitle}</p>
      )}
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} className="max-w-52" />}
      {slots.text1?.text && (
        <p className="font-hand text-2xl text-white/90">{slots.text1.text}</p>
      )}
    </div>
  );
}

function LayoutSingle({ slots }: LayoutProps) {
  return (
    <div className="flex h-full items-center justify-center">
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} className="max-w-64" />}
    </div>
  );
}

function LayoutDuo({ slots }: LayoutProps) {
  return (
    <div className="flex h-full flex-col justify-center">
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="ml-[6%] max-w-44 self-start @xl:max-w-52" />
      )}
      {slots.photo2 && (
        <PolaroidFrame
          slot={slots.photo2}
          className="-mt-10 mr-[6%] max-w-44 self-end @xl:max-w-52"
        />
      )}
    </div>
  );
}

function LayoutTrio({ slots }: LayoutProps) {
  return (
    <div className="flex h-full flex-col justify-center">
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="ml-[4%] max-w-36 self-start @xl:max-w-40" />
      )}
      {slots.photo2 && (
        <PolaroidFrame
          slot={slots.photo2}
          className="-mt-9 mr-[4%] max-w-36 self-end @xl:max-w-40"
        />
      )}
      {slots.photo3 && (
        <PolaroidFrame slot={slots.photo3} className="-mt-7 max-w-36 self-center @xl:max-w-40" />
      )}
    </div>
  );
}

function LayoutPhotoText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="ml-[5%] max-w-48 self-start @xl:max-w-56" />
      )}
      <TextBlock
        slot={slots.text1}
        theme={theme}
        className="mr-[5%] line-clamp-[8] max-w-[85%] self-end"
      />
    </div>
  );
}

function LayoutDuoText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col justify-center">
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="ml-[4%] max-w-36 self-start @xl:max-w-44" />
      )}
      {slots.photo2 && (
        <PolaroidFrame
          slot={slots.photo2}
          className="-mt-9 mr-[4%] max-w-36 self-end @xl:max-w-44"
        />
      )}
      <TextBlock
        slot={slots.text1}
        theme={theme}
        className="mt-4 line-clamp-5 max-w-[90%] self-center"
      />
    </div>
  );
}

function LayoutTrioText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col justify-center">
      {/* Three photos plus a story is the tightest layout — keep the frames
          small and heavily overlapped so the text still fits the page. */}
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="ml-[3%] max-w-28 self-start" />
      )}
      {slots.photo2 && (
        <PolaroidFrame slot={slots.photo2} className="-mt-10 mr-[3%] max-w-28 self-end" />
      )}
      {slots.photo3 && (
        <PolaroidFrame slot={slots.photo3} className="-mt-10 max-w-28 self-center" />
      )}
      <TextBlock
        slot={slots.text1}
        theme={theme}
        className="mt-3 line-clamp-3 max-w-[92%] self-center text-base"
      />
    </div>
  );
}

function LayoutVideo({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {slots.video1 && <FilmFrame slot={slots.video1} className="max-w-60" />}
      <TextBlock
        slot={slots.text1}
        theme={theme}
        className="line-clamp-3 max-w-[92%] text-center text-base"
      />
    </div>
  );
}

function LayoutText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <TextBlock
        slot={slots.text1}
        theme={theme}
        className="line-clamp-[12] max-w-prose text-xl"
      />
    </div>
  );
}

function LayoutQuote({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full items-center justify-center text-center">
      {slots.text1?.text && (
        <blockquote className={`max-w-prose font-hand text-4xl leading-snug ${theme.ink}`}>
          {slots.text1.text}
        </blockquote>
      )}
    </div>
  );
}

function LayoutClosing({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      {slots.text1?.text && (
        <p className={`max-w-prose font-hand text-3xl ${theme.ink}`}>{slots.text1.text}</p>
      )}
      <span className={`font-hand text-xl ${theme.inkSoft}`}>~ bersambung ~</span>
    </div>
  );
}

const RENDERERS: Record<PageData["layout"], (props: LayoutProps) => React.ReactNode> = {
  COVER: LayoutCover,
  SINGLE: LayoutSingle,
  DUO: LayoutDuo,
  TRIO: LayoutTrio,
  PHOTO_TEXT: LayoutPhotoText,
  DUO_TEXT: LayoutDuoText,
  TRIO_TEXT: LayoutTrioText,
  VIDEO: LayoutVideo,
  TEXT: LayoutText,
  QUOTE: LayoutQuote,
  CLOSING: LayoutClosing,
};

export function renderLayout(page: PageData, book: BookMeta, theme: Theme) {
  const Renderer = RENDERERS[page.layout];
  return <Renderer slots={slotMap(page)} book={book} theme={theme} />;
}
