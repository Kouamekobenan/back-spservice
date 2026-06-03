-- CreateTable
CREATE TABLE "public"."change_log" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "shopId" TEXT,
    "payload" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "change_log_changedAt_idx" ON "public"."change_log"("changedAt");

-- CreateIndex
CREATE INDEX "change_log_shopId_changedAt_idx" ON "public"."change_log"("shopId", "changedAt");

-- CreateIndex
CREATE INDEX "change_log_entityType_changedAt_idx" ON "public"."change_log"("entityType", "changedAt");
