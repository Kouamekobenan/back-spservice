-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);
