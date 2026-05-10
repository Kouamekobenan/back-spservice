-- DropIndex
DROP INDEX "public"."shop_settings_shopId_key";

-- AlterTable
ALTER TABLE "public"."shop_settings" ALTER COLUMN "shopId" DROP NOT NULL;
