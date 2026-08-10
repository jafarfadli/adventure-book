import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { withBase } from "./basePath";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export function uploadDir(): string {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) throw new Error("UPLOAD_DIR is not set");
  return dir;
}

/**
 * §6 pipeline: EXIF-aware rotate, resize (no upscale), re-encode to webp.
 * Re-encoding drops metadata — no GPS/EXIF leaks in a public book.
 */
export async function processUpload(
  input: Buffer,
): Promise<{ imageUrl: string; thumbUrl: string }> {
  const id = randomUUID();
  const dir = uploadDir();

  const main = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const thumb = await sharp(input)
    .rotate()
    .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.webp`), main);
  await writeFile(path.join(dir, `${id}.thumb.webp`), thumb);

  // Stored with the base path so <img src> works as-is under the subpath.
  return {
    imageUrl: withBase(`/api/media/${id}.webp`),
    thumbUrl: withBase(`/api/media/${id}.thumb.webp`),
  };
}
