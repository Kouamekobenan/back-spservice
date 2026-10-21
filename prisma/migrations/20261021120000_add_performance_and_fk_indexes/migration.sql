-- CreateIndex
CREATE INDEX IF NOT EXISTS "categories_shopId_idx" ON "public"."categories"("shopId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_batches_productId_idx" ON "public"."product_batches"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "public"."customers"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "credit_payments_customerId_idx" ON "public"."credit_payments"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cash_sessions_shopId_openedAt_idx" ON "public"."cash_sessions"("shopId", "openedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cash_sessions_userId_openedAt_idx" ON "public"."cash_sessions"("userId", "openedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sale_items_productId_idx" ON "public"."sale_items"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sale_payments_saleId_idx" ON "public"."sale_payments"("saleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_order_items_purchaseOrderId_idx" ON "public"."purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "purchase_order_items_productId_idx" ON "public"."purchase_order_items"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_transfer_items_transferId_idx" ON "public"."stock_transfer_items"("transferId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_transfer_items_productId_idx" ON "public"."stock_transfer_items"("productId");
