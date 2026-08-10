"use client";

import { useState, useTransition } from "react";
import { createPage } from "@/actions/pages";
import { LAYOUTS } from "@/lib/layouts";
import { Layout } from "@prisma/client";

export function AddPageForm({ bookId }: { bookId: string }) {
  const [layout, setLayout] = useState<Layout>(Layout.SINGLE);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPage(bookId, layout);
      } catch {
        setError("Gagal menambah halaman. Coba lagi, ya.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg bg-white/70 p-5 shadow-sm"
    >
      <label className="flex flex-col gap-1 text-sm text-stone-600">
        Layout halaman baru
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as Layout)}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          {(Object.keys(LAYOUTS) as Layout[]).map((key) => (
            <option key={key} value={key}>
              {LAYOUTS[key].label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white transition hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {pending ? "Menambah…" : "+ Tambah halaman"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
