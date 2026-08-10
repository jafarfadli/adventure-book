-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "locationLabel" TEXT,
ADD COLUMN     "locationSource" TEXT;
