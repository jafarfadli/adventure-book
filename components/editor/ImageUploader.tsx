"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toaster";
import { withBase } from "@/lib/basePath";

type Media = { imageUrl: string | null; thumbUrl: string | null };
export type UploadMeta = {
  lat: number | null;
  lng: number | null;
  aspect: string | null;
};

export function ImageUploader({
  value,
  onChange,
}: {
  value: Media;
  /** meta is present only right after a fresh upload (geotag + detected format). */
  onChange: (v: Media, meta?: UploadMeta) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(withBase("/api/upload"), { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as
        | {
            imageUrl?: string;
            thumbUrl?: string;
            lat?: number | null;
            lng?: number | null;
            aspect?: string | null;
            error?: string;
          }
        | null;
      if (res.ok && data?.imageUrl && data?.thumbUrl) {
        onChange(
          { imageUrl: data.imageUrl, thumbUrl: data.thumbUrl },
          {
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            aspect: data.aspect ?? null,
          },
        );
      } else {
        toast(data?.error ?? "Upload gagal. Coba lagi, ya.");
      }
    } catch {
      toast("Upload gagal. Coba lagi, ya.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      {value.thumbUrl ? (
        // Dynamic media route, intentionally a plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.thumbUrl}
          alt="Pratinjau foto"
          className="h-20 w-20 rounded border border-stone-200 bg-stone-100 object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded border-2 border-dashed border-stone-300 text-xs text-stone-400">
          kosong
        </div>
      )}
      <div className="flex flex-col gap-2 text-sm">
        <label className="cursor-pointer rounded-md border border-stone-300 px-3 py-1.5 text-stone-700 transition hover:bg-white">
          {busy ? "Mengunggah…" : value.imageUrl ? "Ganti foto" : "Pilih foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={onFile}
            disabled={busy}
            className="sr-only"
          />
        </label>
        {value.imageUrl && (
          <button
            type="button"
            onClick={() => onChange({ imageUrl: null, thumbUrl: null })}
            className="text-left text-rose-700 hover:underline"
          >
            Hapus foto
          </button>
        )}
      </div>
    </div>
  );
}
