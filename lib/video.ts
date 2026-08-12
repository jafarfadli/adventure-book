import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { withBase } from "./basePath";
import { detectFormat, type FrameFormat } from "./frames";
import { uploadDir } from "./images";

const run = promisify(execFile);

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

// Transcoding a clip takes seconds to tens of seconds; cap it so a pathological
// file can't pin a request forever.
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;

export type VideoResult = {
  videoUrl: string;
  imageUrl: string;
  thumbUrl: string;
  aspect: FrameFormat;
};

/**
 * §6 video pipeline. iPhone clips are usually HEVC in a .mov container, which
 * most browsers refuse to play, so everything is re-encoded to H.264/AAC MP4.
 *
 * - `-map_metadata -1` strips all metadata (including GPS): the book is public.
 * - `-movflags +faststart` puts the index up front so playback can start
 *   before the file finishes downloading.
 * - h264_videotoolbox uses the M4's hardware encoder.
 */
export async function processVideoUpload(input: Buffer): Promise<VideoResult> {
  const id = randomUUID();
  const dir = uploadDir();
  const work = await mkdtempWork();
  const src = path.join(work, "src");
  const out = path.join(work, "out.mp4");
  const poster = path.join(work, "poster.jpg");

  try {
    await writeFile(src, input);

    await run(
      "ffmpeg",
      [
        "-y",
        "-i", src,
        "-map_metadata", "-1",
        "-c:v", "h264_videotoolbox",
        "-b:v", "4M",
        "-vf", "scale='min(1280,iw)':-2",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        out,
      ],
      { timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 1 << 24 },
    );

    // Poster frame for the film-strip thumbnail. Seek 1s in, but fall back to
    // the very first frame for clips shorter than that.
    try {
      await run(
        "ffmpeg",
        ["-y", "-ss", "00:00:01", "-i", out, "-frames:v", "1", poster],
        { timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 1 << 24 },
      );
    } catch {
      await run("ffmpeg", ["-y", "-i", out, "-frames:v", "1", poster], {
        timeout: FFMPEG_TIMEOUT_MS,
        maxBuffer: 1 << 24,
      });
    }

    const [mp4, posterBuf] = await Promise.all([readFile(out), readFile(poster)]);
    // The poster carries the transcoded clip's dimensions, so one probe
    // covers both the frame format and the poster images.
    const posterMeta = await sharp(posterBuf).metadata();
    const aspect = detectFormat(posterMeta.width ?? 0, posterMeta.height ?? 0);
    const main = await sharp(posterBuf)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const thumb = await sharp(posterBuf)
      .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.mp4`), mp4);
    await writeFile(path.join(dir, `${id}.webp`), main);
    await writeFile(path.join(dir, `${id}.thumb.webp`), thumb);

    return {
      videoUrl: withBase(`/api/media/${id}.mp4`),
      imageUrl: withBase(`/api/media/${id}.webp`),
      thumbUrl: withBase(`/api/media/${id}.thumb.webp`),
      aspect,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

async function mkdtempWork(): Promise<string> {
  const dir = path.join(tmpdir(), `ab-video-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}
