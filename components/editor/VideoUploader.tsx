"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toaster";
import { withBase } from "@/lib/basePath";

export type VideoMedia = {
  videoUrl: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
};

export function VideoUploader({
  value,
  onChange,
}: {
  value: VideoMedia;
  onChange: (v: VideoMedia) => void;
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
        | { videoUrl?: string; imageUrl?: string; thumbUrl?: string; error?: string }
        | null;
      if (res.ok && data?.videoUrl && data?.imageUrl && data?.thumbUrl) {
        onChange({
          videoUrl: data.videoUrl,
          imageUrl: data.imageUrl,
          thumbUrl: data.thumbUrl,
        });
      } else {
        toast(data?.error ?? "Upload video gagal. Coba lagi, ya.");
      }
    } catch {
      toast("Upload video gagal. Coba lagi, ya.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      {value.thumbUrl ? (
        // Poster frame extracted from the clip.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.thumbUrl}
          alt="Pratinjau video"
          className="h-20 w-20 rounded border border-stone-200 bg-stone-900 object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded border-2 border-dashed border-stone-300 text-xs text-stone-400">
          kosong
        </div>
      )}
      <div className="flex flex-col gap-2 text-sm">
        <label className="cursor-pointer rounded-md border border-stone-300 px-3 py-1.5 text-stone-700 transition hover:bg-white">
          {busy
            ? "Memproses video…"
            : value.videoUrl
              ? "Ganti video"
              : "Pilih video"}
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={onFile}
            disabled={busy}
            className="sr-only"
          />
        </label>
        {busy && (
          <p className="text-stone-500">
            Video dikonversi dulu biar bisa diputar di semua browser — beberapa
            detik, jangan tutup halaman.
          </p>
        )}
        {value.videoUrl && !busy && (
          <button
            type="button"
            onClick={() =>
              onChange({ videoUrl: null, imageUrl: null, thumbUrl: null })
            }
            className="text-left text-rose-700 hover:underline"
          >
            Hapus video
          </button>
        )}
      </div>
    </div>
  );
}
