import { withBase } from "@/lib/basePath";

export type UploadResult = {
  imageUrl: string;
  thumbUrl: string;
  videoUrl?: string;
  width?: number;
  height?: number;
  takenAt?: string | null;
  lat?: number | null;
  lng?: number | null;
};

/** POST one file to the upload route (photos are resized, videos transcoded). */
export async function uploadMedia(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(withBase("/api/upload"), { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as (UploadResult & { error?: string }) | null;
  if (!res.ok || !data || !data.imageUrl) throw new Error(data?.error ?? "Upload gagal");
  return data;
}

export const isVideoFile = (f: File) => f.type.startsWith("video/");
