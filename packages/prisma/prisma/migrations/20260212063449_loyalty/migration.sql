/*
  Warnings:

  - You are about to drop the column `currentTierId` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `lastVisitAt` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `lifetimeSpend` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `pointsBalance` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalCashbackEarned` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalCashbackRedeemed` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `visitCount` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the `cashback_transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `points_transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionValueKind" AS ENUM ('CASHBACK', 'AMOUNT_SPENT_POINTS', 'VISIT_POINTS');

-- DropForeignKey
ALTER TABLE "business_customer" DROP CONSTRAINT "business_customer_currentTierId_fkey";

-- DropForeignKey
ALTER TABLE "cashback_transaction" DROP CONSTRAINT "cashback_transaction_billId_fkey";

-- DropForeignKey
ALTER TABLE "cashback_transaction" DROP CONSTRAINT "cashback_transaction_businessId_customerId_fkey";

-- DropForeignKey
ALTER TABLE "cashback_transaction" DROP CONSTRAINT "cashback_transaction_loyaltyId_fkey";

-- DropForeignKey
ALTER TABLE "points_transaction" DROP CONSTRAINT "points_transaction_billId_fkey";

-- DropForeignKey
ALTER TABLE "points_transaction" DROP CONSTRAINT "points_transaction_businessId_customerId_fkey";

-- DropIndex
DROP INDEX "business_customer_currentTierId_idx";

-- AlterTable
ALTER TABLE "business_customer" DROP COLUMN "currentTierId",
DROP COLUMN "lastVisitAt",
DROP COLUMN "lifetimeSpend",
DROP COLUMN "pointsBalance",
DROP COLUMN "totalCashbackEarned",
DROP COLUMN "totalCashbackRedeemed",
DROP COLUMN "visitCount";

-- DropTable
DROP TABLE "cashback_transaction";

-- DropTable
DROP TABLE "points_transaction";

-- DropEnum
DROP TYPE "CashbackSource";

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "valueKind" "TransactionValueKind" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "billId" TEXT,
    "feedbackResponseId" TEXT,
    "scratchCardResponseId" TEXT,
    "loyaltyId" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cashbackBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountSpentBalance" INTEGER NOT NULL DEFAULT 0,
    "visitPointsBalance" INTEGER NOT NULL DEFAULT 0,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_businessId_customerId_idx" ON "transaction"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "transaction_businessId_customerId_createdAt_idx" ON "transaction"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "transaction_billId_idx" ON "transaction"("billId");

-- CreateIndex
CREATE INDEX "transaction_feedbackResponseId_idx" ON "transaction"("feedbackResponseId");

-- CreateIndex
CREATE INDEX "transaction_scratchCardResponseId_idx" ON "transaction"("scratchCardResponseId");

-- CreateIndex
CREATE INDEX "transaction_loyaltyId_idx" ON "transaction"("loyaltyId");

-- CreateIndex
CREATE INDEX "transaction_type_idx" ON "transaction"("type");

-- CreateIndex
CREATE INDEX "transaction_source_idx" ON "transaction"("source");

-- CreateIndex
CREATE INDEX "transaction_valueKind_idx" ON "transaction"("valueKind");

-- CreateIndex
CREATE INDEX "transaction_expiresAt_idx" ON "transaction"("expiresAt");

-- CreateIndex
CREATE INDEX "wallet_businessId_customerId_idx" ON "wallet"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_businessId_customerId_key" ON "wallet"("businessId", "customerId");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_feedbackResponseId_fkey" FOREIGN KEY ("feedbackResponseId") REFERENCES "feedback_response"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_scratchCardResponseId_fkey" FOREIGN KEY ("scratchCardResponseId") REFERENCES "scratch_card_response"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;
