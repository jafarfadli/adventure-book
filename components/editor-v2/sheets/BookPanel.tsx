"use client";

import { useRef, useState } from "react";
import { Icon, IconButton } from "@/components/v2/Icon";
import type { BookPatch } from "@/lib/v2/edit";
import type { BookV2 } from "@/lib/v2/types";
import { uploadMedia } from "../upload";
import { ThemeRow } from "./Pickers";

// The book's own parts: title and volume, the cover photo (and which part of
// it shows in the arch window), the note on the cover, the closing words and
// the book's theme. Text saves when the field is left.

const field =
  "h-12 w-full rounded-xl border border-[#e7dfe2] bg-white px-3 font-hand text-2xl font-bold text-[#2b2326] focus-visible:outline-2 focus-visible:outline-[#2b2326]";

export function BookPanel({ book, onPatch }: { book: BookV2; onPatch: (p: BookPatch) => void }) {
  const [title, setTitle] = useState(book.title);
  const [volume, setVolume] = useState(String(book.volume));
  const [coverText, setCoverText] = useState(book.coverText ?? "");
  const [closing, setClosing] = useState(book.closingText ?? "");
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number; w: number; h: number } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="relative h-[150px] w-[100px] shrink-0 overflow-hidden rounded-t-full bg-[#d6688a] shadow-inner">
          {book.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverImageUrl}
              alt="foto sampul"
              draggable={false}
              className="h-full w-full cursor-grab touch-none object-cover"
              style={{ objectPosition: `${book.coverFocusX * 100}% ${book.coverFocusY * 100}%` }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const r = e.currentTarget.getBoundingClientRect();
                drag.current = { x: e.clientX, y: e.clientY, fx: book.coverFocusX, fy: book.coverFocusY, w: r.width, h: r.height };
              }}
              onPointerUp={(e) => {
                const d = drag.current;
                drag.current = null;
                if (!d) return;
                const fx = Math.min(1, Math.max(0, d.fx - (e.clientX - d.x) / (d.w * 2)));
                const fy = Math.min(1, Math.max(0, d.fy - (e.clientY - d.y) / (d.h * 2)));
                onPatch({ coverFocusX: fx, coverFocusY: fy });
              }}
            />
          )}
          <span className="absolute right-1 bottom-1">
            <IconButton
              icon={uploading ? "spinner" : "swap"}
              label="Ganti foto sampul"
              size="sm"
              disabled={uploading}
              onClick={() => input.current?.click()}
            />
          </span>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                const r = await uploadMedia(f);
                onPatch({ coverImageUrl: r.imageUrl, coverFocusX: 0.5, coverFocusY: 0.5 });
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input aria-label="Judul buku" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== book.title && onPatch({ title: title.trim() })} className={field} />
          <label className="flex items-center gap-2 font-hand-alt text-[#665b60]">
            <span>vol.</span>
            <input
              aria-label="Volume"
              inputMode="numeric"
              value={volume}
              onChange={(e) => setVolume(e.target.value.replace(/\D/g, "").slice(0, 3))}
              onBlur={() => {
                const v = Number(volume);
                if (v >= 1 && v !== book.volume) onPatch({ volume: v });
              }}
              className="h-10 w-16 rounded-lg border border-[#e7dfe2] bg-white px-2 text-center text-lg"
            />
          </label>
          <input
            aria-label="Catatan di sampul"
            placeholder="…"
            value={coverText}
            maxLength={120}
            onChange={(e) => setCoverText(e.target.value)}
            onBlur={() => coverText !== (book.coverText ?? "") && onPatch({ coverText: coverText })}
            className={`${field} text-xl`}
          />
        </div>
      </div>
      <label className="flex items-center gap-3">
        <span className="font-hand text-2xl font-bold text-[#a5436a]">~</span>
        <input
          aria-label="Kata penutup"
          placeholder="bersambung…"
          value={closing}
          maxLength={200}
          onChange={(e) => setClosing(e.target.value)}
          onBlur={() => closing !== (book.closingText ?? "") && onPatch({ closingText: closing })}
          className={field}
        />
      </label>
      <div className="flex items-center gap-3">
        <Icon name="book" className="h-5 w-5 shrink-0 text-[#665b60]" title="Tema buku" />
        <div className="flex-1">
          <ThemeRow current={book.theme} bookTheme={book.theme} allowFollow={false} onPick={(t) => t && onPatch({ theme: t })} />
        </div>
      </div>
    </div>
  );
}
