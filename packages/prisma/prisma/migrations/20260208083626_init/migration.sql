/*
  Warnings:

  - You are about to drop the column `loyaltyPointsEarned` on the `bill` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyPointsRedeemed` on the `bill` table. All the data in the column will be lost.
  - You are about to drop the column `cashbackBranding` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `cashbackInFinalAmount` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `earnPointsOnPaidAmountOnly` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `earningPercentage` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `minPurchaseForEarning` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `minPurchaseForRedemption` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `upperLimitBillAmount` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `upperLimitClaimableAmount` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyId` on the `loyalty_tier` table. All the data in the column will be lost.
  - You are about to drop the column `minPoints` on the `loyalty_tier` table. All the data in the column will be lost.
  - You are about to drop the column `rewards` on the `loyalty_tier` table. All the data in the column will be lost.
  - You are about to drop the `points_bucket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `points_redemption_allocation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `loyaltyType` to the `loyalty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minLifetimeSpend` to the `loyalty_tier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierConfigId` to the `loyalty_tier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LoyaltyType" AS ENUM ('CASHBACK', 'TIER', 'AMOUNT_SPENT', 'VISIT_MADE');

-- CreateEnum
CREATE TYPE "LoyaltyRewardType" AS ENUM ('FREE_ITEM', 'PERCENTAGE_DISCOUNT', 'CASH_DISCOUNT');

-- CreateEnum
CREATE TYPE "VisitIntervalUnit" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH');

-- DropForeignKey
ALTER TABLE "loyalty_tier" DROP CONSTRAINT "loyalty_tier_loyaltyId_fkey";

-- DropForeignKey
ALTER TABLE "points_bucket" DROP CONSTRAINT "points_bucket_businessId_customerId_fkey";

-- DropForeignKey
ALTER TABLE "points_bucket" DROP CONSTRAINT "points_bucket_earnedTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "points_redemption_allocation" DROP CONSTRAINT "points_redemption_allocation_bucketId_fkey";

-- DropForeignKey
ALTER TABLE "points_redemption_allocation" DROP CONSTRAINT "points_redemption_allocation_redeemTransactionId_fkey";

-- DropIndex
DROP INDEX "loyalty_tier_loyaltyId_idx";

-- AlterTable
ALTER TABLE "bill" DROP COLUMN "loyaltyPointsEarned",
DROP COLUMN "loyaltyPointsRedeemed",
ADD COLUMN     "cashbackAmount" DOUBLE PRECISION,
ADD COLUMN     "subtotal" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "business_customer" ADD COLUMN     "lastVisitAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "visitCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "loyalty" DROP COLUMN "cashbackBranding",
DROP COLUMN "cashbackInFinalAmount",
DROP COLUMN "earnPointsOnPaidAmountOnly",
DROP COLUMN "earningPercentage",
DROP COLUMN "minPurchaseForEarning",
DROP COLUMN "minPurchaseForRedemption",
DROP COLUMN "upperLimitBillAmount",
DROP COLUMN "upperLimitClaimableAmount",
ADD COLUMN     "loyaltyType" "LoyaltyType" NOT NULL;

-- AlterTable
ALTER TABLE "loyalty_tier" DROP COLUMN "loyaltyId",
DROP COLUMN "minPoints",
DROP COLUMN "rewards",
ADD COLUMN     "cashbackPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maxCashbackCap" DOUBLE PRECISION,
ADD COLUMN     "maxCashbackCapEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxLifetimeSpend" DOUBLE PRECISION,
ADD COLUMN     "minLifetimeSpend" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "minPurchaseForEarning" DOUBLE PRECISION,
ADD COLUMN     "minPurchaseForEarningEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minPurchaseForRedemption" DOUBLE PRECISION,
ADD COLUMN     "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tierConfigId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "points_transaction" ADD COLUMN     "description" TEXT,
ADD COLUMN     "remainingAmount" INTEGER;

-- DropTable
DROP TABLE "points_bucket";

-- DropTable
DROP TABLE "points_redemption_allocation";

-- CreateTable
CREATE TABLE "loyalty_cashback_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "cashbackPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onFinalAmount" BOOLEAN NOT NULL DEFAULT false,
    "maxCashbackCap" DOUBLE PRECISION,
    "minPurchaseForEarningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForEarning" DOUBLE PRECISION,
    "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForRedemption" DOUBLE PRECISION,
    "redemptionBalanceLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "redemptionBalanceLimitAmount" DOUBLE PRECISION,
    "redemptionBalanceLimitPercentage" DOUBLE PRECISION,
    "redemptionBillLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "redemptionBillLimitAmount" DOUBLE PRECISION,
    "redemptionBillLimitPercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_cashback_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tier_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "pointsPerRupee" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxCashbackCapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxCashbackCap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tier_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_amount_spent_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "pointsPerRupee" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "onFinalAmount" BOOLEAN NOT NULL DEFAULT false,
    "maxPointsPerPurchase" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_amount_spent_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_visit_made_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "pointsPerVisit" INTEGER NOT NULL DEFAULT 1,
    "visitIntervalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "visitIntervalValue" INTEGER,
    "visitIntervalUnit" "VisitIntervalUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_visit_made_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_reward_stage" (
    "id" TEXT NOT NULL,
    "amountSpentConfigId" TEXT,
    "visitMadeConfigId" TEXT,
    "pointsRequired" INTEGER NOT NULL,
    "rewardType" "LoyaltyRewardType" NOT NULL,
    "rewardName" TEXT NOT NULL,
    "freeItemSkuId" TEXT,
    "freeItemName" TEXT,
    "percentageValue" DOUBLE PRECISION,
    "appliesToEntirePurchase" BOOLEAN NOT NULL DEFAULT true,
    "specificProductIds" TEXT[],
    "cashAmount" DOUBLE PRECISION,
    "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForRedemption" DOUBLE PRECISION,
    "maxDiscountCapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxDiscountCap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_reward_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cashback_config_loyaltyId_key" ON "loyalty_cashback_config"("loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tier_config_loyaltyId_key" ON "loyalty_tier_config"("loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_amount_spent_config_loyaltyId_key" ON "loyalty_amount_spent_config"("loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_visit_made_config_loyaltyId_key" ON "loyalty_visit_made_config"("loyaltyId");

-- CreateIndex
CREATE INDEX "loyalty_reward_stage_amountSpentConfigId_idx" ON "loyalty_reward_stage"("amountSpentConfigId");

-- CreateIndex
CREATE INDEX "loyalty_reward_stage_visitMadeConfigId_idx" ON "loyalty_reward_stage"("visitMadeConfigId");

-- CreateIndex
CREATE INDEX "loyalty_loyaltyType_idx" ON "loyalty"("loyaltyType");

-- CreateIndex
CREATE INDEX "loyalty_tier_tierConfigId_idx" ON "loyalty_tier"("tierConfigId");

-- CreateIndex
CREATE INDEX "points_transaction_type_remainingAmount_idx" ON "points_transaction"("type", "remainingAmount");

-- AddForeignKey
ALTER TABLE "loyalty_cashback_config" ADD CONSTRAINT "loyalty_cashback_config_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_tier_config" ADD CONSTRAINT "loyalty_tier_config_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_tier" ADD CONSTRAINT "loyalty_tier_tierConfigId_fkey" FOREIGN KEY ("tierConfigId") REFERENCES "loyalty_tier_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_amount_spent_config" ADD CONSTRAINT "loyalty_amount_spent_config_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_visit_made_config" ADD CONSTRAINT "loyalty_visit_made_config_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_reward_stage" ADD CONSTRAINT "loyalty_reward_stage_amountSpentConfigId_fkey" FOREIGN KEY ("amountSpentConfigId") REFERENCES "loyalty_amount_spent_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_reward_stage" ADD CONSTRAINT "loyalty_reward_stage_visitMadeConfigId_fkey" FOREIGN KEY ("visitMadeConfigId") REFERENCES "loyalty_visit_made_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_reward_stage" ADD CONSTRAINT "loyalty_reward_stage_freeItemSkuId_fkey" FOREIGN KEY ("freeItemSkuId") REFERENCES "sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;
