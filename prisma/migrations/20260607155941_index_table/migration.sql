-- CreateIndex
CREATE INDEX "customers_totalDebt_idx" ON "public"."customers"("totalDebt");

-- CreateIndex
CREATE INDEX "expenses_shopId_date_idx" ON "public"."expenses"("shopId", "date");

-- CreateIndex
CREATE INDEX "sales_shopId_status_idx" ON "public"."sales"("shopId", "status");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "public"."sales"("customerId");
