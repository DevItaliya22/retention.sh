/*
  Warnings:

  - A unique constraint covering the columns `[billId]` on the table `shopify_order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "shopify_order" ADD COLUMN     "billId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shopify_order_billId_key" ON "shopify_order"("billId");

-- AddForeignKey
ALTER TABLE "shopify_order" ADD CONSTRAINT "shopify_order_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
