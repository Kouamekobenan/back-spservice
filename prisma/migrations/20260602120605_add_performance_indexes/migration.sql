-- CreateIndex
CREATE INDEX "products_shopId_idx" ON "public"."products"("shopId");

-- CreateIndex
CREATE INDEX "products_shopId_isActive_idx" ON "public"."products"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "public"."sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sales_shopId_createdAt_idx" ON "public"."sales"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_userId_createdAt_idx" ON "public"."sales"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "public"."stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_shopId_createdAt_idx" ON "public"."stock_movements"("shopId", "createdAt");
