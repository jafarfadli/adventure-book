-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('COVER', 'SINGLE', 'DUO', 'TRIO', 'PHOTO_TEXT', 'TEXT', 'QUOTE', 'CLOSING');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('PHOTO', 'TEXT');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'cream',
    "coverImageUrl" TEXT,
    "editPasswordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "layout" "Layout" NOT NULL DEFAULT 'SINGLE',
    "bgStyle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "SlotType" NOT NULL,
    "imageUrl" TEXT,
    "thumbUrl" TEXT,
    "caption" TEXT,
    "text" TEXT,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tapeStyle" TEXT,
    "dateLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Page_bookId_idx" ON "Page"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_bookId_order_key" ON "Page"("bookId", "order");

-- CreateIndex
CREATE INDEX "Slot_pageId_idx" ON "Slot"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_pageId_key_key" ON "Slot"("pageId", "key");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
