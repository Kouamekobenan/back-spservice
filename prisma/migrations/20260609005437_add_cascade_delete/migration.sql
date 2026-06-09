-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cash_sessions" DROP CONSTRAINT "cash_sessions_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."expenses" DROP CONSTRAINT "expenses_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_batches" DROP CONSTRAINT "product_batches_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_components" DROP CONSTRAINT "product_components_componentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_components" DROP CONSTRAINT "product_components_composedId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_orders" DROP CONSTRAINT "purchase_orders_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sales" DROP CONSTRAINT "sales_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_transfers" DROP CONSTRAINT "stock_transfers_fromShopId_fkey";

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_components" ADD CONSTRAINT "product_components_composedId_fkey" FOREIGN KEY ("composedId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_batches" ADD CONSTRAINT "product_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_sessions" ADD CONSTRAINT "cash_sessions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_transfers" ADD CONSTRAINT "stock_transfers_fromShopId_fkey" FOREIGN KEY ("fromShopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
