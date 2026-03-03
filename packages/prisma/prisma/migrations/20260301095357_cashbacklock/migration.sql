-- AlterTable
ALTER TABLE "referral_log" ADD COLUMN     "referredBusinessId" TEXT,
ADD COLUMN     "referredCustomerId" TEXT,
ADD COLUMN     "referrerRewardUnlockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "referral_program" ADD COLUMN     "lockReferralPointsUntilFirstPurchase" BOOLEAN NOT NULL DEFAULT false;
