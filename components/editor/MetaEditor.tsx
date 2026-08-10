"use client";

import { useState, useTransition } from "react";
import { updateBookMeta } from "@/actions/book";
import { useToast } from "@/components/ui/Toaster";
import { THEMES } from "@/lib/themes";
import { ImageUploader } from "./ImageUploader";

const THEME_LABELS: Record<string, string> = {
  cream: "Krem",
  dusk: "Senja",
  kraft: "Kraft",
};

const inputCls =
  "rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1";

export function MetaEditor({
  bookId,
  initial,
}: {
  bookId: string;
  initial: {
    title: string;
    subtitle: string | null;
    theme: string;
    coverImageUrl: string | null;
  };
}) {
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [theme, setTheme] = useState(initial.theme);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        await updateBookMeta(bookId, { title, subtitle, theme, coverImageUrl });
        setSaved(true);
      } catch {
        toast("Gagal menyimpan info buku. Coba lagi, ya.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg bg-white/70 p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Info buku
      </h2>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Judul
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Subjudul
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={200}
          className={inputCls}
        />
      </label>
      <div className="flex flex-col gap-1 text-sm text-stone-600">
        Foto sampul (untuk pratinjau tautan saat dibagikan)
        <ImageUploader
          value={{ imageUrl: coverImageUrl, thumbUrl: coverImageUrl }}
          onChange={(m) => setCoverImageUrl(m.imageUrl)}
        />
      </div>
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Tema
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={inputCls}
        >
          {Object.keys(THEMES).map((key) => (
            <option key={key} value={key}>
              {THEME_LABELS[key] ?? key}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Tersimpan ✓</span>}
      </div>
    </form>
  );
}
