-- AlterTable
ALTER TABLE "bill" ADD COLUMN     "cashierId" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "cashier" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "bill_cashierId_idx" ON "bill"("cashierId");

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "cashier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
