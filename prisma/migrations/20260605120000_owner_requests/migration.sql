-- CreateEnum
CREATE TYPE "OwnerRequestStatus" AS ENUM ('NEW', 'REVIEWING', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateTable
CREATE TABLE "owner_requests" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "role" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "status" "OwnerRequestStatus" NOT NULL DEFAULT 'NEW',
    "tenantId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "owner_requests_status_idx" ON "owner_requests"("status");
CREATE INDEX "owner_requests_createdAt_idx" ON "owner_requests"("createdAt");
