"use client";

import type { Theme } from "@/lib/themes";

export function PageNav({
  label,
  canPrev,
  canNext,
  onPrev,
  onNext,
  theme,
}: {
  label: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  theme: Theme;
}) {
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-black/15 " +
    "bg-white/60 text-xl shadow-sm transition hover:bg-white focus-visible:outline-2 " +
    "focus-visible:outline-offset-2 disabled:opacity-30 disabled:hover:bg-white/60";

  return (
    <nav aria-label="Navigasi halaman" className="flex items-center gap-5">
      <button
        type="button"
        className={btn}
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Halaman sebelumnya"
      >
        ←
      </button>
      <span className={`font-hand text-xl tabular-nums ${theme.inkSoft}`}>{label}</span>
      <button
        type="button"
        className={btn}
        onClick={onNext}
        disabled={!canNext}
        aria-label="Halaman berikutnya"
      >
        →
      </button>
    </nav>
  );
}
