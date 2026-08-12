import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { uploadDir } from "@/lib/images";

// Only flat, generated filenames — rules out traversal and anything we didn't write.
const FILENAME_RE = /^[A-Za-z0-9-]+(\.thumb)?\.(webp|mp4)$/;

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  mp4: "video/mp4",
};

function streamFile(file: string, start: number, end: number): ReadableStream {
  return Readable.toWeb(
    createReadStream(file, { start, end }),
  ) as unknown as ReadableStream;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const name = segments.join("/");
  if (!FILENAME_RE.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  const file = path.join(uploadDir(), name);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPES[name.split(".").pop() as string];
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    // Video seeking and iOS playback both depend on range support.
    "Accept-Ranges": "bytes",
  };

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (match[1] === "" && match[2] === "")) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    // Either end is optional: "bytes=500-" or the suffix form "bytes=-500".
    let start: number;
    let end: number;
    if (match[1] === "") {
      const suffix = Number(match[2]);
      start = Math.max(0, size - suffix);
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    return new Response(streamFile(file, start, end), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new Response(streamFile(file, 0, size - 1), {
    status: 200,
    headers: { ...headers, "Content-Length": String(size) },
  });
}
