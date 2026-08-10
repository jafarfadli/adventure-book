import { Layout, PrismaClient, SlotType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LAYOUTS } from "../lib/layouts";

const prisma = new PrismaClient();

// Demo content per slot key, applied on top of the LAYOUTS contract.
type SlotContent = {
  caption?: string;
  text?: string;
  rotation?: number;
  tapeStyle?: string;
  dateLabel?: string;
};

type SeedPage = { layout: Layout; content: Record<string, SlotContent> };

const SEED_PAGES: SeedPage[] = [
  {
    layout: Layout.COVER,
    content: {
      photo1: { rotation: -2, tapeStyle: "classic" },
      text1: { text: "Cerita kita, satu halaman demi satu halaman." },
    },
  },
  {
    layout: Layout.SINGLE,
    content: {
      photo1: {
        caption: "Kencan pertama kita! Masih malu-malu 😊",
        rotation: 3,
        tapeStyle: "classic",
        dateLabel: "14 Feb 2025",
      },
    },
  },
  {
    layout: Layout.PHOTO_TEXT,
    content: {
      photo1: {
        caption: "Sunset di pantai",
        rotation: -4,
        dateLabel: "20 Mar 2025",
      },
      text1: {
        text: "Hari itu kita nggak sengaja nyasar, tapi malah nemu pantai paling cantik yang pernah kita lihat. Kadang rencana yang gagal justru jadi kenangan terbaik.",
      },
    },
  },
  {
    layout: Layout.QUOTE,
    content: {
      text1: { text: "“Rumah bukan tempat, tapi kamu.”" },
    },
  },
];

async function main() {
  const slug = process.env.DEFAULT_SLUG ?? "our-story";
  const password = process.env.SEED_EDIT_PASSWORD;
  if (!password) {
    throw new Error("SEED_EDIT_PASSWORD is not set; refusing to seed a book without a password.");
  }

  const editPasswordHash = await bcrypt.hash(password, 12);

  const book = await prisma.book.upsert({
    where: { slug },
    update: { editPasswordHash },
    create: {
      slug,
      title: "Petualangan Kita",
      subtitle: "Buku kenangan berdua",
      theme: "cream",
      editPasswordHash,
    },
  });

  // Re-seeding replaces the demo pages wholesale (slots cascade).
  await prisma.page.deleteMany({ where: { bookId: book.id } });

  for (const [order, { layout, content }] of SEED_PAGES.entries()) {
    await prisma.page.create({
      data: {
        bookId: book.id,
        order,
        layout,
        slots: {
          create: LAYOUTS[layout].slots.map((spec) => ({
            key: spec.key,
            type: SlotType[spec.type],
            ...content[spec.key],
          })),
        },
      },
    });
  }

  const pageCount = await prisma.page.count({ where: { bookId: book.id } });
  console.log(`Seeded book "${book.title}" (/book/${book.slug}) with ${pageCount} pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
