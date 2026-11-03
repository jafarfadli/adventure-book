-- Approved by the couple on 2026-11-03: v1 is gone, drop what only it used.
-- Not reversible except from a pg_dump taken before this migration.

-- v1 book parts: their photo and text were copied into Book (coverImageUrl,
-- coverText, closingText) by the v2 backfill; slots go with them (cascade).
BEGIN;
DELETE FROM "Page" WHERE "layout" IN ('COVER', 'CLOSING');
-- keep Page.order contiguous from 0; two passes because (bookId, order) is unique
UPDATE "Page" SET "order" = "order" + 1000000;
UPDATE "Page" p SET "order" = r.n - 1
FROM (SELECT id, row_number() OVER (PARTITION BY "bookId" ORDER BY "order") AS n FROM "Page") r
WHERE p.id = r.id;
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Layout_new" AS ENUM ('SINGLE', 'DUO', 'TRIO', 'PHOTO_TEXT', 'DUO_TEXT', 'TRIO_TEXT', 'VIDEO', 'TEXT', 'QUOTE');
ALTER TABLE "public"."Page" ALTER COLUMN "layout" DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN "layout" TYPE "Layout_new" USING ("layout"::text::"Layout_new");
ALTER TYPE "Layout" RENAME TO "Layout_old";
ALTER TYPE "Layout_new" RENAME TO "Layout";
DROP TYPE "public"."Layout_old";
ALTER TABLE "Page" ALTER COLUMN "layout" SET DEFAULT 'SINGLE';
COMMIT;

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_bookId_fkey";

-- DropIndex
DROP INDEX "WishlistItem_bookId_idx";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "editPasswordHash";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "bgStyle";

-- AlterTable
ALTER TABLE "Slot" DROP COLUMN "aspect",
DROP COLUMN "rotation",
DROP COLUMN "tapeStyle";

-- AlterTable
ALTER TABLE "WishlistItem" DROP COLUMN "bookId",
ALTER COLUMN "shelfId" SET NOT NULL;

