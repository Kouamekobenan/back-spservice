-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_shopId_expiryDate_idx" ON "products"("shopId", "expiryDate");
