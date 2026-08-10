import type { PageData, SlotData } from "@/lib/types";
import type { Theme } from "@/lib/themes";
import { PolaroidFrame } from "./PolaroidFrame";

// One small renderer per Layout value, selected by renderLayout(). The same
// components will back the editor preview later — keep them presentation-only.

export type BookMeta = { title: string; subtitle: string | null };
type LayoutProps = { slots: Record<string, SlotData>; book: BookMeta; theme: Theme };

function slotMap(page: PageData): Record<string, SlotData> {
  return Object.fromEntries(page.slots.map((s) => [s.key, s]));
}

function TextBlock({ slot, theme, className = "" }: { slot?: SlotData; theme: Theme; className?: string }) {
  if (!slot?.text) return null;
  return (
    <p className={`whitespace-pre-wrap font-hand-alt text-lg leading-relaxed ${theme.ink} ${className}`}>
      {slot.text}
    </p>
  );
}

function LayoutCover({ slots, book, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <h1 className={`font-hand text-5xl md:text-6xl ${theme.ink}`}>{book.title}</h1>
      {book.subtitle && (
        <p className={`font-hand-alt text-xl ${theme.inkSoft}`}>{book.subtitle}</p>
      )}
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} className="max-w-60" />}
      {slots.text1?.text && (
        <p className={`font-hand text-2xl ${theme.accent}`}>{slots.text1.text}</p>
      )}
    </div>
  );
}

function LayoutSingle({ slots }: LayoutProps) {
  return (
    <div className="flex h-full items-center justify-center">
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} />}
    </div>
  );
}

// Layout switches below use container queries (@xl etc.) so a page adapts to
// its own width — a flip-book page is ~450px wide even on a wide viewport.
function LayoutDuo({ slots }: LayoutProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 @xl:flex-row @xl:gap-8">
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} className="max-w-44 @xl:max-w-56" />}
      {slots.photo2 && <PolaroidFrame slot={slots.photo2} className="max-w-44 @xl:max-w-56" />}
    </div>
  );
}

function LayoutTrio({ slots }: LayoutProps) {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-6">
      {slots.photo1 && <PolaroidFrame slot={slots.photo1} className="max-w-40 @xl:max-w-48" />}
      {slots.photo2 && (
        <PolaroidFrame slot={slots.photo2} className="max-w-40 @xl:max-w-48 @xl:translate-y-6" />
      )}
      {slots.photo3 && <PolaroidFrame slot={slots.photo3} className="max-w-40 @xl:max-w-48" />}
    </div>
  );
}

function LayoutPhotoText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 @xl:flex-row @xl:gap-8">
      {slots.photo1 && (
        <PolaroidFrame slot={slots.photo1} className="shrink-0 max-w-48 @xl:max-w-60" />
      )}
      <TextBlock slot={slots.text1} theme={theme} className="max-w-prose" />
    </div>
  );
}

function LayoutText({ slots, theme }: LayoutProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <TextBlock slot={slots.text1} theme={theme} className="max-w-prose text-xl" />
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
  TEXT: LayoutText,
  QUOTE: LayoutQuote,
  CLOSING: LayoutClosing,
};

export function renderLayout(page: PageData, book: BookMeta, theme: Theme) {
  const Renderer = RENDERERS[page.layout];
  return <Renderer slots={slotMap(page)} book={book} theme={theme} />;
}
