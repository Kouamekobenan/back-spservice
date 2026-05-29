-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "shopId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
