-- Drop existing full composite unique constraint (replaced by partial index below)
ALTER TABLE "public"."products" DROP CONSTRAINT IF EXISTS "products_barcode_shopId_key";

-- CreateIndex (non-unique) for Prisma schema change @@index([barcode])
CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "public"."products"("barcode");

-- Partial unique index: barcode unique per shop, NULL barcodes excluded
-- Plusieurs produits peuvent ne pas avoir de barcode (NULL != NULL en SQL),
-- mais deux produits d'une même boutique ne peuvent pas partager le même barcode.
CREATE UNIQUE INDEX IF NOT EXISTS "products_barcode_unique"
  ON "public"."products" ("barcode", "shopId")
  WHERE "barcode" IS NOT NULL;
