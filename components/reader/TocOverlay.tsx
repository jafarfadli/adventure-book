"use client";

import { LAYOUTS } from "@/lib/layouts";
import type { PageData } from "@/lib/types";

function snippet(page: PageData): string | null {
  for (const slot of page.slots) {
    const text = slot.caption ?? slot.text;
    if (text) return text.length > 42 ? `${text.slice(0, 42)}…` : text;
  }
  return null;
}

export function TocOverlay({
  pages,
  currentIndex,
  onJump,
  onClose,
}: {
  pages: PageData[];
  currentIndex: number;
  onJump: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daftar isi"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-lg bg-[#fbf6ea] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-hand text-3xl text-stone-800">Daftar isi</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar isi"
            className="rounded-full px-2 py-1 text-stone-500 transition hover:bg-stone-800/10 focus-visible:outline-2"
          >
            ✕
          </button>
        </div>
        <ol className="flex flex-col gap-1">
          {pages.map((page, i) => {
            const extra = snippet(page);
            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className={`w-full rounded-md px-3 py-2 text-left transition hover:bg-stone-800/5 focus-visible:outline-2 ${
                    i === currentIndex ? "bg-stone-800/10" : ""
                  }`}
                >
                  <span className="mr-3 font-hand text-lg text-stone-400">{i + 1}</span>
                  <span className="text-sm text-stone-700">
                    {LAYOUTS[page.layout].label}
                  </span>
                  {extra && (
                    <span className="block pl-8 font-hand text-lg leading-snug text-stone-500">
                      {extra}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
