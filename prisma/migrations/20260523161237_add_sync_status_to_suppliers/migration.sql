-- AlterTable
ALTER TABLE "public"."suppliers" ADD COLUMN     "localId" TEXT,
ADD COLUMN     "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'SYNCED';
