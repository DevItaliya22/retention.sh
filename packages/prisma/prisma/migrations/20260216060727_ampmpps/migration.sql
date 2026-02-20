/*
  Warnings:

  - You are about to drop the column `brandingId` on the `campaign` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "campaign" DROP CONSTRAINT "campaign_brandingId_fkey";

-- DropIndex
DROP INDEX "campaign_brandingId_key";

-- AlterTable
ALTER TABLE "campaign" DROP COLUMN "brandingId",
ADD COLUMN     "appliesTo" "BenefitAppliesTo" NOT NULL DEFAULT 'ENTIRE_PURCHASE',
ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "maxRedemptionAmount" DOUBLE PRECISION,
ADD COLUMN     "maxRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redemptionLimit" "RedemptionLimit" NOT NULL DEFAULT 'ONCE',
ADD COLUMN     "rewardValue" TEXT,
ADD COLUMN     "termsAndConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "textColor" TEXT,
ADD COLUMN     "themeColor" TEXT;
