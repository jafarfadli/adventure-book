import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { uploadDir } from "@/lib/images";

// Only flat, generated filenames — rules out traversal and anything we didn't write.
const FILENAME_RE = /^[A-Za-z0-9-]+(\.thumb)?\.webp$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const name = segments.join("/");
  if (!FILENAME_RE.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(uploadDir(), name));
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
