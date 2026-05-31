-- CreateEnum
CREATE TYPE "public"."ShopType" AS ENUM ('SUPERMARKET', 'HARDWARE', 'PHARMACY', 'RESTAURANT', 'GAS_STATION', 'CLOTHING', 'ELECTRONICS', 'BAKERY', 'WHOLESALE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."shops" ADD COLUMN     "shopType" "public"."ShopType" NOT NULL DEFAULT 'SUPERMARKET',
ADD COLUMN     "shopTypeLabel" TEXT;
