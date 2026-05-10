/*
  Warnings:

  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_shopId_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "lastLoginAt",
DROP COLUMN "shopId";

-- CreateTable
CREATE TABLE "public"."user_shop_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "roleInShop" "public"."Role",
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shop_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_access_userId_shopId_key" ON "public"."user_shop_access"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "public"."user_shop_access" ADD CONSTRAINT "user_shop_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_shop_access" ADD CONSTRAINT "user_shop_access_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
