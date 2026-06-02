-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('EXPERIENCE', 'TRANSFER', 'PRODUCT', 'QUOTE');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('PER_PERSON', 'PER_TRIP', 'FIXED', 'ON_QUOTE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "includedJson" JSONB,
ADD COLUMN     "infoJson" JSONB,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxPeople" INTEGER,
ADD COLUMN     "minPeople" INTEGER,
ADD COLUMN     "priceMode" "PriceMode" NOT NULL DEFAULT 'PER_PERSON',
ADD COLUMN     "priceUnit" TEXT,
ADD COLUMN     "requiresDate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbUrl" TEXT,
ADD COLUMN     "type" "ServiceType" NOT NULL DEFAULT 'EXPERIENCE';

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
