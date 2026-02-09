/*
  Warnings:

  - You are about to drop the column `minPurchaseForEarning` on the `loyalty_tier` table. All the data in the column will be lost.
  - You are about to drop the column `minPurchaseForEarningEnabled` on the `loyalty_tier` table. All the data in the column will be lost.
  - You are about to drop the column `maxCashbackCap` on the `loyalty_tier_config` table. All the data in the column will be lost.
  - You are about to drop the column `maxCashbackCapEnabled` on the `loyalty_tier_config` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CashbackSource" AS ENUM ('BILL');

-- AlterTable
ALTER TABLE "business_customer" ADD COLUMN     "totalCashbackEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "loyalty_tier" DROP COLUMN "minPurchaseForEarning",
DROP COLUMN "minPurchaseForEarningEnabled";

-- AlterTable
ALTER TABLE "loyalty_tier_config" DROP COLUMN "maxCashbackCap",
DROP COLUMN "maxCashbackCapEnabled";

-- CreateTable
CREATE TABLE "cashback_transaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "loyaltyId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "source" "CashbackSource" NOT NULL DEFAULT 'BILL',
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashback_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cashback_transaction_businessId_customerId_idx" ON "cashback_transaction"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "cashback_transaction_businessId_customerId_createdAt_idx" ON "cashback_transaction"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "cashback_transaction_billId_idx" ON "cashback_transaction"("billId");

-- CreateIndex
CREATE INDEX "cashback_transaction_loyaltyId_idx" ON "cashback_transaction"("loyaltyId");

-- AddForeignKey
ALTER TABLE "cashback_transaction" ADD CONSTRAINT "cashback_transaction_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_transaction" ADD CONSTRAINT "cashback_transaction_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_transaction" ADD CONSTRAINT "cashback_transaction_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
