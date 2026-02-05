-- AlterTable
ALTER TABLE "points_transaction" ADD COLUMN     "billId" TEXT;

-- Backfill billId from sourceId where source = 'BILL'
UPDATE "points_transaction"
SET "billId" = "sourceId"
WHERE "source" = 'BILL' AND "sourceId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "points_transaction_billId_idx" ON "points_transaction"("billId");

-- AddForeignKey
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
