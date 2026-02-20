-- AlterTable
ALTER TABLE "loyalty_amount_spent_config" ADD COLUMN     "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "loyalty_cashback_config" ADD COLUMN     "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "loyalty_tier_config" ADD COLUMN     "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "loyalty_visit_made_config" ADD COLUMN     "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT true;
