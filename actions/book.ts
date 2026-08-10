"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { MEDIA_PATH_RE } from "@/lib/basePath";
import { prisma } from "@/lib/db";
import { THEMES } from "@/lib/themes";

const metaSchema = z.object({
  title: z.string().trim().min(1, "Judul tidak boleh kosong").max(120),
  subtitle: z
    .string()
    .trim()
    .max(200)
    .transform((s) => (s === "" ? null : s)),
  theme: z.string().refine((t) => t in THEMES, "Tema tidak dikenal"),
  coverImageUrl: z.string().regex(MEDIA_PATH_RE, "Path media tidak valid").nullable(),
});

export async function updateBookMeta(
  bookIdRaw: string,
  metaRaw: {
    title: string;
    subtitle: string;
    theme: string;
    coverImageUrl: string | null;
  },
) {
  const bookId = z.string().min(1).max(64).parse(bookIdRaw);
  const meta = metaSchema.parse(metaRaw);
  await requireEditor(bookId);

  const book = await prisma.book.update({
    where: { id: bookId },
    data: meta,
    select: { slug: true },
  });

  revalidatePath(`/book/${book.slug}`);
  revalidatePath(`/book/${book.slug}/edit`);
}
