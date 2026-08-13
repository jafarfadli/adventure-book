"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Theme and cover art are fixed for now; the editor only writes the text.
const metaSchema = z.object({
  title: z.string().trim().min(1, "Judul tidak boleh kosong").max(120),
  subtitle: z
    .string()
    .trim()
    .max(200)
    .transform((s) => (s === "" ? null : s)),
});

export async function updateBookMeta(
  bookIdRaw: string,
  metaRaw: { title: string; subtitle: string },
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
