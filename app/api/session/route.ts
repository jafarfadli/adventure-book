import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearEditorSession, createEditorSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/rate-limit";

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

// Same message for wrong password and unknown slug: never reveal which.
const GENERIC_ERROR = "Password salah. Coba lagi, ya.";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!consumeToken(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Tunggu 5 menit dulu, ya." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { slug, password } = parsed.data;

  const book = await prisma.book.findUnique({
    where: { slug },
    select: { id: true, editPasswordHash: true },
  });
  const hash = book?.editPasswordHash ?? "";
  const valid = hash ? await bcrypt.compare(password, hash) : false;
  if (!book || !valid) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await createEditorSession(book.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearEditorSession();
  return NextResponse.json({ ok: true });
}
