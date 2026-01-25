/*
  Warnings:

  - You are about to drop the column `currencyCode` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `currencySymbol` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `pointsName` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `currentpoints` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `storeCredit` on the `business_customer` table. All the data in the column will be lost.
  - You are about to drop the column `referralSlug` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `referredById` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `feedback_config` table. All the data in the column will be lost.
  - You are about to drop the column `customerNumbers` on the `loyalty` table. All the data in the column will be lost.
  - You are about to drop the column `referrerId` on the `referral_log` table. All the data in the column will be lost.
  - You are about to drop the column `rewardDetails` on the `referral_log` table. All the data in the column will be lost.
  - You are about to drop the column `rewardGiven` on the `referral_log` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `scratch_card` table. All the data in the column will be lost.
  - You are about to drop the column `onlineReviewPlatform` on the `scratch_card` table. All the data in the column will be lost.
  - You are about to drop the column `redirectUrl` on the `scratch_card` table. All the data in the column will be lost.
  - You are about to drop the column `reviewPlatformUrl` on the `scratch_card` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `scratch_card` table. All the data in the column will be lost.
  - You are about to drop the `loyalty_bonus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loyalty_message` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referralSlug]` on the table `business_customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cashierLinkSlug,businessId]` on the table `cashier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `referral_log` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `business` table without a default value. This is not possible if the table is not empty.
  - The required column `referralSlug` was added to the `business_customer` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `email` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerBusinessId` to the `referral_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerCustomerId` to the `referral_log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `referral_log` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cashier" DROP CONSTRAINT "cashier_businessId_fkey";

-- DropForeignKey
ALTER TABLE "customer" DROP CONSTRAINT "customer_referredById_fkey";

-- DropForeignKey
ALTER TABLE "feedback_config" DROP CONSTRAINT "feedback_config_businessId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_bonus" DROP CONSTRAINT "loyalty_bonus_loyaltyId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_message" DROP CONSTRAINT "loyalty_message_loyaltyId_fkey";

-- DropForeignKey
ALTER TABLE "referral_log" DROP CONSTRAINT "referral_log_referrerId_fkey";

-- DropIndex
DROP INDEX "cashier_cashierLinkSlug_key";

-- DropIndex
DROP INDEX "customer_referralSlug_idx";

-- DropIndex
DROP INDEX "customer_referralSlug_key";

-- DropIndex
DROP INDEX "customer_referredById_idx";

-- DropIndex
DROP INDEX "feedback_config_businessId_idx";

-- DropIndex
DROP INDEX "feedback_config_businessId_key";

-- DropIndex
DROP INDEX "referral_log_referrerId_idx";

-- AlterTable
ALTER TABLE "business" DROP COLUMN "currencyCode",
DROP COLUMN "currencySymbol",
DROP COLUMN "pointsName",
ADD COLUMN     "defaultCurrencyCode" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "defaultCurrencySymbol" TEXT NOT NULL DEFAULT '₹',
ADD COLUMN     "defaultPointsName" TEXT NOT NULL DEFAULT 'Points',
ADD COLUMN     "referedBonusPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralRewardPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "business_customer" DROP COLUMN "currentpoints",
DROP COLUMN "storeCredit",
ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralSlug" TEXT NOT NULL,
ADD COLUMN     "referredByBusinessId" TEXT,
ADD COLUMN     "referredByCustomerId" TEXT;

-- AlterTable
ALTER TABLE "customer" DROP COLUMN "referralSlug",
DROP COLUMN "referredById",
ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "feedback_config" DROP COLUMN "businessId";

-- AlterTable
ALTER TABLE "loyalty" DROP COLUMN "customerNumbers";

-- AlterTable
ALTER TABLE "referral_log" DROP COLUMN "referrerId",
DROP COLUMN "rewardDetails",
DROP COLUMN "rewardGiven",
ADD COLUMN     "becameCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referrerBusinessId" TEXT NOT NULL,
ADD COLUMN     "referrerCustomerId" TEXT NOT NULL,
ADD COLUMN     "rewardPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "scratch_card" DROP COLUMN "description",
DROP COLUMN "onlineReviewPlatform",
DROP COLUMN "redirectUrl",
DROP COLUMN "reviewPlatformUrl",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "role" TEXT;

-- DropTable
DROP TABLE "loyalty_bonus";

-- DropTable
DROP TABLE "loyalty_message";

-- CreateTable
CREATE TABLE "points_transaction" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratch_card_action" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "scratchCardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratch_card_action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_transaction_businessId_customerId_idx" ON "points_transaction"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "points_transaction_source_idx" ON "points_transaction"("source");

-- CreateIndex
CREATE INDEX "points_transaction_type_idx" ON "points_transaction"("type");

-- CreateIndex
CREATE INDEX "scratch_card_action_scratchCardId_idx" ON "scratch_card_action"("scratchCardId");

-- CreateIndex
CREATE UNIQUE INDEX "business_slug_key" ON "business"("slug");

-- CreateIndex
CREATE INDEX "business_id_idx" ON "business"("id");

-- CreateIndex
CREATE INDEX "business_slug_idx" ON "business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_customer_referralSlug_key" ON "business_customer"("referralSlug");

-- CreateIndex
CREATE INDEX "business_customer_referralSlug_idx" ON "business_customer"("referralSlug");

-- CreateIndex
CREATE INDEX "business_customer_referredByBusinessId_referredByCustomerId_idx" ON "business_customer"("referredByBusinessId", "referredByCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_cashierLinkSlug_businessId_key" ON "cashier"("cashierLinkSlug", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_log_slug_key" ON "referral_log"("slug");

-- CreateIndex
CREATE INDEX "referral_log_slug_idx" ON "referral_log"("slug");

-- CreateIndex
CREATE INDEX "referral_log_referrerBusinessId_referrerCustomerId_idx" ON "referral_log"("referrerBusinessId", "referrerCustomerId");

-- CreateIndex
CREATE INDEX "referral_log_becameCustomer_idx" ON "referral_log"("becameCustomer");

-- CreateIndex
CREATE INDEX "scratch_card_slug_idx" ON "scratch_card"("slug");

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_referredByBusinessId_referredByCustomerI_fkey" FOREIGN KEY ("referredByBusinessId", "referredByCustomerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_log" ADD CONSTRAINT "referral_log_referrerBusinessId_referrerCustomerId_fkey" FOREIGN KEY ("referrerBusinessId", "referrerCustomerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_action" ADD CONSTRAINT "scratch_card_action_scratchCardId_fkey" FOREIGN KEY ("scratchCardId") REFERENCES "scratch_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier" ADD CONSTRAINT "cashier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
