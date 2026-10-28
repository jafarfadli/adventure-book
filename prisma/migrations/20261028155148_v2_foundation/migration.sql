-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "closingText" TEXT,
ADD COLUMN     "coverFocusX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "coverFocusY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "coverText" TEXT,
ADD COLUMN     "shelfId" TEXT,
ADD COLUMN     "shelfOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume" INTEGER;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "decorSeed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "template" TEXT,
ADD COLUMN     "theme" TEXT;

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "focusX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "focusY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "showDate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "takenAt" TIMESTAMP(3),
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "shelfId" TEXT;

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "editPasswordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_shelfId_idx" ON "Book"("shelfId");

-- CreateIndex
CREATE INDEX "WishlistItem_shelfId_idx" ON "WishlistItem"("shelfId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
