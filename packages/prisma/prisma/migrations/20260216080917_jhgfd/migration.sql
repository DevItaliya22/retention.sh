-- AlterTable
ALTER TABLE "campaign" ADD COLUMN     "instantCashbackRedeemable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minPurchaseForEarning" DOUBLE PRECISION,
ADD COLUMN     "minPurchaseForEarningEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minPurchaseForRedemption" DOUBLE PRECISION,
ADD COLUMN     "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false;
