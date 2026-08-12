-- AlterEnum
ALTER TYPE "Layout" ADD VALUE 'VIDEO';

-- AlterEnum
ALTER TYPE "SlotType" ADD VALUE 'VIDEO';

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "videoUrl" TEXT;
