/**
 * v2 backfill: fills the new columns from what v1 already stores.
 *
 *   npx tsx --env-file=.env scripts/v2/backfill.ts <media-dims|taken-at|templates|book-parts|all> [--dry-run] [--allow-prod]
 *
 * Refuses to touch any database other than adventure_book_v2dev unless
 * --allow-prod is passed (release time only, after a backup). Every step only
 * fills empty fields, so it is safe to run more than once.
 */
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mediaFileName, planBookParts, planTakenAt, planTemplates } from "../../lib/v2/backfill";

const args = process.argv.slice(2);
const step = args.find((a) => !a.startsWith("--")) ?? "";
const dryRun = args.includes("--dry-run");
const allowProd = args.includes("--allow-prod");
const STEPS = ["media-dims", "taken-at", "templates", "book-parts"] as const;

function guardDatabase() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");
  const db = new URL(raw).pathname.replace(/^\//, "");
  if (db !== "adventure_book_v2dev" && !allowProd) {
    throw new Error(`Refusing to write to database "${db}". Pass --allow-prod after taking a backup.`);
  }
  return db;
}

const prisma = new PrismaClient();

async function mediaDims() {
  const dir = process.env.UPLOAD_DIR;
  if (!dir) throw new Error("UPLOAD_DIR is not set");
  const slots = await prisma.slot.findMany({
    where: { imageUrl: { not: null }, width: null },
    select: { id: true, imageUrl: true },
  });
  let n = 0;
  for (const s of slots) {
    const name = mediaFileName(s.imageUrl);
    if (!name) continue;
    try {
      const meta = await sharp(path.join(dir, name)).metadata();
      if (!meta.width || !meta.height) continue;
      n++;
      if (!dryRun) await prisma.slot.update({ where: { id: s.id }, data: { width: meta.width, height: meta.height } });
    } catch {
      console.warn(`  missing or unreadable: ${name}`);
    }
  }
  console.log(`media-dims: ${n}/${slots.length} slots${dryRun ? " (dry run)" : ""}`);
}

async function takenAt() {
  const slots = await prisma.slot.findMany({ select: { id: true, dateLabel: true, takenAt: true } });
  const plan = planTakenAt(slots);
  for (const p of plan) if (!dryRun) await prisma.slot.update({ where: { id: p.id }, data: { takenAt: p.takenAt } });
  console.log(`taken-at: ${plan.length} slots${dryRun ? " (dry run)" : ""}`);
}

async function templates() {
  const pages = await prisma.page.findMany({
    select: { id: true, layout: true, template: true, slots: { select: { key: true, width: true, height: true } } },
  });
  const plan = planTemplates(pages);
  const counts: Record<string, number> = {};
  for (const p of plan) counts[p.template] = (counts[p.template] ?? 0) + 1;
  for (const p of plan) if (!dryRun) await prisma.page.update({ where: { id: p.id }, data: { template: p.template } });
  console.log(`templates: ${plan.length} pages ${JSON.stringify(counts)}${dryRun ? " (dry run)" : ""}`);
}

async function bookParts() {
  const books = await prisma.book.findMany({
    select: {
      id: true,
      slug: true,
      theme: true,
      coverImageUrl: true,
      coverText: true,
      closingText: true,
      pages: { select: { layout: true, slots: { select: { key: true, imageUrl: true, text: true } } } },
    },
  });
  for (const b of books) {
    const plan = planBookParts(b, b.pages);
    console.log(`book-parts: ${b.slug} ${JSON.stringify(plan)}${dryRun ? " (dry run)" : ""}`);
    if (!dryRun && Object.keys(plan).length > 0) await prisma.book.update({ where: { id: b.id }, data: plan });
  }
}

async function main() {
  const db = guardDatabase();
  console.log(`database: ${db}`);
  const run = step === "all" ? [...STEPS] : STEPS.filter((s) => s === step);
  if (run.length === 0) throw new Error(`usage: backfill.ts <${STEPS.join("|")}|all> [--dry-run]`);
  for (const s of run) {
    if (s === "media-dims") await mediaDims();
    if (s === "taken-at") await takenAt();
    if (s === "templates") await templates();
    if (s === "book-parts") await bookParts();
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
