import exifr from "exifr";
import { NextRequest, NextResponse } from "next/server";
import { getEditorBookId } from "@/lib/auth";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, processUpload } from "@/lib/images";

/**
 * Read EXIF GPS before sharp re-encodes (which strips all metadata).
 * A missing or malformed geotag must never fail the upload.
 */
async function extractGps(
  buffer: Buffer,
): Promise<{ lat: number | null; lng: number | null }> {
  try {
    const gps = await exifr.gps(buffer);
    if (
      gps &&
      Number.isFinite(gps.latitude) &&
      Number.isFinite(gps.longitude) &&
      Math.abs(gps.latitude) <= 90 &&
      Math.abs(gps.longitude) <= 180
    ) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch {
    // corrupt/unsupported EXIF — treat as no geotag
  }
  return { lat: null, lng: null };
}

export async function POST(req: NextRequest) {
  // requireEditor before any side effect; upload is scoped by the session itself.
  const bookId = await getEditorBookId();
  if (!bookId) {
    return NextResponse.json({ error: "Sesi edit tidak ditemukan." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format foto harus JPG, PNG, WebP, atau HEIC." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Foto terlalu besar (maksimal 12MB)." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const gps = await extractGps(buffer);
    const result = await processUpload(buffer);
    return NextResponse.json({ ...result, ...gps });
  } catch {
    // e.g. HEIC without libheif support, or a corrupt file.
    return NextResponse.json(
      { error: "Foto tidak bisa diproses. Coba format JPG/PNG/WebP, ya." },
      { status: 422 },
    );
  }
}
