-- CreateEnum
CREATE TYPE "PartnerRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'PERMANENTLY_REJECTED');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('ACTIVE', 'DISSOLVED');

-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'PARTNER_EXCHANGE';

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "maxPartnerAllowed" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "receivePartnershipOffers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "partner_request" (
    "id" TEXT NOT NULL,
    "senderBusinessId" TEXT NOT NULL,
    "receiverBusinessId" TEXT NOT NULL,
    "status" "PartnerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "partnershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_partnership" (
    "id" TEXT NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "sharedReferrals" BOOLEAN NOT NULL DEFAULT false,
    "shareReferralRewards" BOOLEAN NOT NULL DEFAULT false,
    "sharedCampaigns" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_member" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pointToCurrencyRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "createdByBusinessId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "contactNumber" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "themeColor" TEXT,
    "textColor" TEXT,
    "logo" TEXT,
    "bannerImage" TEXT,
    "rewardType" "CampaignRewardType" NOT NULL DEFAULT 'FREE_ITEM',
    "rewardValue" TEXT,
    "appliesTo" "BenefitAppliesTo" NOT NULL DEFAULT 'ENTIRE_PURCHASE',
    "maxRedemptionAmount" DOUBLE PRECISION,
    "maxRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForEarningEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForEarning" DOUBLE PRECISION,
    "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForRedemption" DOUBLE PRECISION,
    "instantCashbackRedeemable" BOOLEAN NOT NULL DEFAULT false,
    "redemptionLimit" "RedemptionLimit" NOT NULL DEFAULT 'ONCE',
    "termsAndConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_request_partnershipId_key" ON "partner_request"("partnershipId");

-- CreateIndex
CREATE INDEX "partner_request_receiverBusinessId_idx" ON "partner_request"("receiverBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_request_senderBusinessId_receiverBusinessId_key" ON "partner_request"("senderBusinessId", "receiverBusinessId");

-- CreateIndex
CREATE INDEX "partnership_member_businessId_idx" ON "partnership_member"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_member_partnershipId_businessId_key" ON "partnership_member"("partnershipId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_campaign_slug_key" ON "partner_campaign"("slug");

-- CreateIndex
CREATE INDEX "partner_campaign_partnershipId_idx" ON "partner_campaign"("partnershipId");

-- CreateIndex
CREATE INDEX "partner_campaign_createdByBusinessId_idx" ON "partner_campaign"("createdByBusinessId");

-- AddForeignKey
ALTER TABLE "partner_request" ADD CONSTRAINT "partner_request_senderBusinessId_fkey" FOREIGN KEY ("senderBusinessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_request" ADD CONSTRAINT "partner_request_receiverBusinessId_fkey" FOREIGN KEY ("receiverBusinessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_request" ADD CONSTRAINT "partner_request_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "business_partnership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_member" ADD CONSTRAINT "partnership_member_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "business_partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_member" ADD CONSTRAINT "partnership_member_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_campaign" ADD CONSTRAINT "partner_campaign_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "business_partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_campaign" ADD CONSTRAINT "partner_campaign_createdByBusinessId_fkey" FOREIGN KEY ("createdByBusinessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
