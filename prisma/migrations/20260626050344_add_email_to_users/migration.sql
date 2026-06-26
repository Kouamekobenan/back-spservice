-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'LOW_STOCK');

-- DropIndex
DROP INDEX "products_barcode_shopId_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "report_subscriptions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_subscriptions_shopId_reportType_isActive_idx" ON "report_subscriptions"("shopId", "reportType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "report_subscriptions_shopId_userId_reportType_key" ON "report_subscriptions"("shopId", "userId", "reportType");

-- AddForeignKey
ALTER TABLE "report_subscriptions" ADD CONSTRAINT "report_subscriptions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_subscriptions" ADD CONSTRAINT "report_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
