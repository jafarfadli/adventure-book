"use client";

import { useState, useTransition } from "react";
import { updateBookMeta } from "@/actions/book";
import { THEMES } from "@/lib/themes";

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
  initial: { title: string; subtitle: string | null; theme: string };
}) {
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [theme, setTheme] = useState(initial.theme);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateBookMeta(bookId, { title, subtitle, theme });
        setSaved(true);
      } catch {
        setError("Gagal menyimpan. Coba lagi, ya.");
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
        {error && (
          <span role="alert" className="text-sm text-rose-700">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
