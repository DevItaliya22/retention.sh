/*
  Warnings:

  - You are about to drop the `_BillToSku` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BillToSku" DROP CONSTRAINT "_BillToSku_A_fkey";

-- DropForeignKey
ALTER TABLE "_BillToSku" DROP CONSTRAINT "_BillToSku_B_fkey";

-- DropTable
DROP TABLE "_BillToSku";

-- CreateTable
CREATE TABLE "bill_line_item" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bill_line_item_billId_idx" ON "bill_line_item"("billId");

-- CreateIndex
CREATE INDEX "bill_line_item_skuId_idx" ON "bill_line_item"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_line_item_billId_skuId_key" ON "bill_line_item"("billId", "skuId");

-- AddForeignKey
ALTER TABLE "bill_line_item" ADD CONSTRAINT "bill_line_item_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line_item" ADD CONSTRAINT "bill_line_item_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;
