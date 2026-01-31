-- CreateEnum
CREATE TYPE "LoyaltyMessageType" AS ENUM ('FIRST_PURCHASE', 'EXPIRE', 'REMINDER', 'SUBSEQUENT_PURCHASE', 'MEMBERSHIP_JOIN');

-- CreateEnum
CREATE TYPE "MembershipBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS', 'NO_DISCOUNT');

-- CreateEnum
CREATE TYPE "BenefitAppliesTo" AS ENUM ('ENTIRE_PURCHASE', 'SPECIFIC_ITEMS');

-- CreateEnum
CREATE TYPE "QrBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS');

-- CreateEnum
CREATE TYPE "ReferalBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FeedbackTiming" AS ENUM ('IMMEDIATELY', 'AFTER_DELAY');

-- CreateEnum
CREATE TYPE "FeedbackCollectionChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'CASHIER_PORTAL');

-- CreateEnum
CREATE TYPE "OnlineReviewPlatform" AS ENUM ('GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'ZOMATO', 'OTHER');

-- CreateEnum
CREATE TYPE "CollectionChannel" AS ENUM ('WHATSAPP', 'LANDING_PAGE');

-- CreateEnum
CREATE TYPE "CustomerTargetGroup" AS ENUM ('NEW_CUSTOMERS', 'NEW_AND_EXISTING', 'EXISTING_CUSTOMERS_ONLY');

-- CreateEnum
CREATE TYPE "RedemptionLimit" AS ENUM ('ONCE', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "AutoCampaignTrigger" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'FIRST_PURCHASE', 'WIN_BACK', 'MEMBERSHIP_EXPIRY', 'POINTS_EXPIRY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'REDEEMED', 'REFUNDED', 'GIFTED', 'ADJUSTMENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('BILL', 'FEEDBACK', 'SCRATCH_CARD', 'CAMPAIGN', 'REFERRAL', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('POINTS', 'STORE_CREDIT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'CASHIER');

-- CreateTable
CREATE TABLE "bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_line_item" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "themeColor" TEXT,
    "textColor" TEXT,
    "bannerImage" TEXT,
    "header" TEXT,
    "subtitle" TEXT,
    "posterTitle" TEXT,
    "posterThemeColor" TEXT,
    "posterTextColor" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultPointsName" TEXT NOT NULL DEFAULT 'Points',
    "defaultCurrencySymbol" TEXT NOT NULL DEFAULT '₹',
    "defaultCurrencyCode" TEXT NOT NULL DEFAULT 'INR',
    "referralEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_customer" (
    "slugId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "referralSlug" TEXT NOT NULL,
    "referredByBusinessId" TEXT,
    "referredByCustomerId" TEXT,
    "tags" TEXT[],
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "currentTierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_customer_pkey" PRIMARY KEY ("businessId","customerId")
);

-- CreateTable
CREATE TABLE "feedback_config" (
    "id" TEXT NOT NULL,
    "brandingId" TEXT,
    "positiveFollowUp" TEXT,
    "negativeFollowUp" TEXT,
    "isHowDidYouHearEnabled" BOOLEAN NOT NULL DEFAULT true,
    "feedbackRewardEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DOUBLE PRECISION,
    "timing" "FeedbackTiming" NOT NULL DEFAULT 'IMMEDIATELY',
    "delaySeconds" INTEGER,
    "collectionChannel" "FeedbackCollectionChannel" NOT NULL DEFAULT 'WHATSAPP',
    "sendViaSmsIfWpFailed" BOOLEAN NOT NULL DEFAULT false,
    "negAlertChannelsWp" BOOLEAN NOT NULL DEFAULT false,
    "negAlertChannelsSms" BOOLEAN NOT NULL DEFAULT false,
    "negAlertChannelsEmail" BOOLEAN NOT NULL DEFAULT false,
    "negFeedbackAlertNumber" TEXT,
    "negFeedbackAlertSmsNumber" TEXT,
    "negFeedbackAlertEmailAddress" TEXT,
    "askForOnlineReviews" BOOLEAN NOT NULL DEFAULT false,
    "onlineReviewLink" TEXT,
    "onlineReviewPlatform" "OnlineReviewPlatform",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_question" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "iconType" TEXT,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "how_did_you_hear_option" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "how_did_you_hear_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_response" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "howDidYouHear" TEXT,
    "selectedCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandingId" TEXT,
    "earningPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashbackInFinalAmount" BOOLEAN NOT NULL DEFAULT false,
    "cashbackBranding" TEXT,
    "minPurchaseForEarning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minPurchaseForRedemption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upperLimitBillAmount" DOUBLE PRECISION,
    "upperLimitClaimableAmount" DOUBLE PRECISION,
    "pointReminderDays" INTEGER,
    "pointExpiryDays" INTEGER,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "rewards" TEXT[],
    "loyaltyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tier_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'DRAFT',
    "brandingId" TEXT,
    "marketingSlug" TEXT NOT NULL,
    "convenienceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentGatewayCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userReceives" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qrImage" TEXT,
    "qrData" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_benefit" (
    "id" TEXT NOT NULL,
    "type" "MembershipBenefitType" NOT NULL,
    "percentage" DOUBLE PRECISION,
    "maxRedeemableAmount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "minPurchaseAmount" DOUBLE PRECISION,
    "item" TEXT,
    "points" INTEGER,
    "appliesTo" "BenefitAppliesTo" DEFAULT 'ENTIRE_PURCHASE',
    "specificItems" TEXT[],
    "membershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_action" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT,
    "collectionChannel" "CollectionChannel" NOT NULL DEFAULT 'LANDING_PAGE',
    "landingPageTitle" TEXT,
    "successPageTitle" TEXT,
    "customerTarget" "CustomerTargetGroup" NOT NULL DEFAULT 'NEW_AND_EXISTING',
    "redemptionLimit" "RedemptionLimit" NOT NULL DEFAULT 'ONCE',
    "brandingId" TEXT,
    "rewardExpiryDays" INTEGER DEFAULT 30,
    "rewardExpiryCommunicationDays" INTEGER DEFAULT 3,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "qrImage" TEXT,
    "redirectSlug" TEXT,
    "successSlug" TEXT,
    "redirectLink" TEXT,
    "successLink" TEXT,
    "membershipId" TEXT,
    "loyaltyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_benefit" (
    "id" TEXT NOT NULL,
    "type" "QrBenefitType" NOT NULL,
    "percentage" DOUBLE PRECISION,
    "maxRedeemableAmount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "minPurchaseAmount" DOUBLE PRECISION,
    "item" TEXT,
    "points" INTEGER,
    "appliesTo" "BenefitAppliesTo" DEFAULT 'ENTIRE_PURCHASE',
    "specificItems" TEXT[],
    "qrId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_action" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "qrId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_program" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "newCustomerBenefitType" "ReferalBenefitType" NOT NULL,
    "newCustomerBenefitValue" INTEGER NOT NULL,
    "newCustomerBenefitExpiresInDays" INTEGER,
    "existingCustomerBenefitType" "ReferalBenefitType" NOT NULL,
    "existingCustomerBenefitValue" INTEGER NOT NULL,
    "existingCustomerBenefitExpiresInDays" INTEGER,
    "sendReminderToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "informationSections" JSONB NOT NULL,
    "branding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_log" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "referrerBusinessId" TEXT NOT NULL,
    "referrerCustomerId" TEXT NOT NULL,
    "newCustomerPhone" TEXT NOT NULL,
    "newCustomerName" TEXT,
    "becameCustomer" BOOLEAN NOT NULL DEFAULT false,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratch_card" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandingId" TEXT,
    "targetGroup" "CustomerTargetGroup" NOT NULL DEFAULT 'NEW_AND_EXISTING',
    "allowMultipleRedemptions" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratch_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratch_card_benefit" (
    "id" TEXT NOT NULL,
    "type" "QrBenefitType" NOT NULL,
    "percentage" DOUBLE PRECISION,
    "maxRedeemableAmount" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "minPurchaseAmount" DOUBLE PRECISION,
    "item" TEXT,
    "points" INTEGER,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "scratchCardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratch_card_benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratch_card_response" (
    "id" TEXT NOT NULL,
    "scratchCardId" TEXT NOT NULL,
    "benefitId" TEXT,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratch_card_response_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "terms_and_conditions" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "loyaltyId" TEXT,
    "membershipId" TEXT,
    "qrId" TEXT,
    "loyaltyTierId" TEXT,
    "referralProgramNewCustomerId" TEXT,
    "referralProgramExistingCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_and_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "phoneNumberVerified" BOOLEAN,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cashierLinkSlug" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bill_businessId_idx" ON "bill"("businessId");

-- CreateIndex
CREATE INDEX "bill_customerId_idx" ON "bill"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_businessId_billNumber_key" ON "bill"("businessId", "billNumber");

-- CreateIndex
CREATE INDEX "bill_line_item_billId_idx" ON "bill_line_item"("billId");

-- CreateIndex
CREATE INDEX "bill_line_item_skuId_idx" ON "bill_line_item"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "bill_line_item_billId_skuId_key" ON "bill_line_item"("billId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "branding_businessId_key" ON "branding"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_slug_key" ON "business"("slug");

-- CreateIndex
CREATE INDEX "business_id_idx" ON "business"("id");

-- CreateIndex
CREATE INDEX "business_slug_idx" ON "business"("slug");

-- CreateIndex
CREATE INDEX "category_businessId_idx" ON "category"("businessId");

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- CreateIndex
CREATE INDEX "sku_businessId_idx" ON "sku"("businessId");

-- CreateIndex
CREATE INDEX "sku_categoryId_idx" ON "sku"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sku_businessId_sku_key" ON "sku"("businessId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "customer_userId_key" ON "customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "business_customer_slugId_key" ON "business_customer"("slugId");

-- CreateIndex
CREATE UNIQUE INDEX "business_customer_referralSlug_key" ON "business_customer"("referralSlug");

-- CreateIndex
CREATE INDEX "business_customer_referralSlug_idx" ON "business_customer"("referralSlug");

-- CreateIndex
CREATE INDEX "business_customer_referredByBusinessId_referredByCustomerId_idx" ON "business_customer"("referredByBusinessId", "referredByCustomerId");

-- CreateIndex
CREATE INDEX "business_customer_currentTierId_idx" ON "business_customer"("currentTierId");

-- CreateIndex
CREATE INDEX "business_customer_slugId_idx" ON "business_customer"("slugId");

-- CreateIndex
CREATE INDEX "business_customer_customerId_idx" ON "business_customer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_config_brandingId_key" ON "feedback_config"("brandingId");

-- CreateIndex
CREATE INDEX "feedback_question_configId_idx" ON "feedback_question"("configId");

-- CreateIndex
CREATE INDEX "feedback_category_configId_idx" ON "feedback_category"("configId");

-- CreateIndex
CREATE INDEX "how_did_you_hear_option_configId_idx" ON "how_did_you_hear_option"("configId");

-- CreateIndex
CREATE INDEX "feedback_response_configId_idx" ON "feedback_response"("configId");

-- CreateIndex
CREATE INDEX "feedback_response_customerId_idx" ON "feedback_response"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_businessId_key" ON "loyalty"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_brandingId_key" ON "loyalty"("brandingId");

-- CreateIndex
CREATE INDEX "loyalty_businessId_idx" ON "loyalty"("businessId");

-- CreateIndex
CREATE INDEX "loyalty_tier_loyaltyId_idx" ON "loyalty_tier"("loyaltyId");

-- CreateIndex
CREATE INDEX "points_transaction_businessId_customerId_idx" ON "points_transaction"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "points_transaction_source_idx" ON "points_transaction"("source");

-- CreateIndex
CREATE INDEX "points_transaction_type_idx" ON "points_transaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "membership_brandingId_key" ON "membership"("brandingId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_marketingSlug_key" ON "membership"("marketingSlug");

-- CreateIndex
CREATE INDEX "membership_businessId_idx" ON "membership"("businessId");

-- CreateIndex
CREATE INDEX "membership_marketingSlug_idx" ON "membership"("marketingSlug");

-- CreateIndex
CREATE INDEX "membership_benefit_membershipId_idx" ON "membership_benefit"("membershipId");

-- CreateIndex
CREATE INDEX "membership_action_membershipId_idx" ON "membership_action"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_brandingId_key" ON "qr"("brandingId");

-- CreateIndex
CREATE INDEX "qr_businessId_idx" ON "qr"("businessId");

-- CreateIndex
CREATE INDEX "qr_membershipId_idx" ON "qr"("membershipId");

-- CreateIndex
CREATE INDEX "qr_loyaltyId_idx" ON "qr"("loyaltyId");

-- CreateIndex
CREATE INDEX "qr_benefit_qrId_idx" ON "qr_benefit"("qrId");

-- CreateIndex
CREATE INDEX "qr_action_qrId_idx" ON "qr_action"("qrId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_program_businessId_key" ON "referral_program"("businessId");

-- CreateIndex
CREATE INDEX "referral_program_businessId_idx" ON "referral_program"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_log_slug_key" ON "referral_log"("slug");

-- CreateIndex
CREATE INDEX "referral_log_slug_idx" ON "referral_log"("slug");

-- CreateIndex
CREATE INDEX "referral_log_referrerBusinessId_referrerCustomerId_idx" ON "referral_log"("referrerBusinessId", "referrerCustomerId");

-- CreateIndex
CREATE INDEX "referral_log_becameCustomer_idx" ON "referral_log"("becameCustomer");

-- CreateIndex
CREATE UNIQUE INDEX "scratch_card_slug_key" ON "scratch_card"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "scratch_card_brandingId_key" ON "scratch_card"("brandingId");

-- CreateIndex
CREATE INDEX "scratch_card_slug_idx" ON "scratch_card"("slug");

-- CreateIndex
CREATE INDEX "scratch_card_businessId_idx" ON "scratch_card"("businessId");

-- CreateIndex
CREATE INDEX "scratch_card_benefit_scratchCardId_idx" ON "scratch_card_benefit"("scratchCardId");

-- CreateIndex
CREATE INDEX "scratch_card_response_scratchCardId_idx" ON "scratch_card_response"("scratchCardId");

-- CreateIndex
CREATE INDEX "scratch_card_response_businessId_customerId_idx" ON "scratch_card_response"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "scratch_card_response_billId_idx" ON "scratch_card_response"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "scratch_card_response_scratchCardId_businessId_customerId_b_key" ON "scratch_card_response"("scratchCardId", "businessId", "customerId", "billId");

-- CreateIndex
CREATE INDEX "scratch_card_action_scratchCardId_idx" ON "scratch_card_action"("scratchCardId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_loyaltyId_idx" ON "terms_and_conditions"("loyaltyId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_membershipId_idx" ON "terms_and_conditions"("membershipId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_qrId_idx" ON "terms_and_conditions"("qrId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_referralProgramNewCustomerId_idx" ON "terms_and_conditions"("referralProgramNewCustomerId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_referralProgramExistingCustomerId_idx" ON "terms_and_conditions"("referralProgramExistingCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_loyaltyId_key" ON "terms_and_conditions"("content", "loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_membershipId_key" ON "terms_and_conditions"("content", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_qrId_key" ON "terms_and_conditions"("content", "qrId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_referralProgramNewCustomerId_key" ON "terms_and_conditions"("content", "referralProgramNewCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_referralProgramExistingCustome_key" ON "terms_and_conditions"("content", "referralProgramExistingCustomerId");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_phoneNumber_idx" ON "user"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "admin_userId_key" ON "admin"("userId");

-- CreateIndex
CREATE INDEX "admin_userId_idx" ON "admin"("userId");

-- CreateIndex
CREATE INDEX "admin_businessId_idx" ON "admin"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_userId_key" ON "cashier"("userId");

-- CreateIndex
CREATE INDEX "cashier_userId_idx" ON "cashier"("userId");

-- CreateIndex
CREATE INDEX "cashier_businessId_idx" ON "cashier"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "cashier_cashierLinkSlug_businessId_key" ON "cashier"("cashierLinkSlug", "businessId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line_item" ADD CONSTRAINT "bill_line_item_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_line_item" ADD CONSTRAINT "bill_line_item_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding" ADD CONSTRAINT "branding_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku" ADD CONSTRAINT "sku_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku" ADD CONSTRAINT "sku_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_referredByBusinessId_referredByCustomerI_fkey" FOREIGN KEY ("referredByBusinessId", "referredByCustomerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "loyalty_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_config" ADD CONSTRAINT "feedback_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_question" ADD CONSTRAINT "feedback_question_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_category" ADD CONSTRAINT "feedback_category_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "how_did_you_hear_option" ADD CONSTRAINT "how_did_you_hear_option_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "feedback_response_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "feedback_response_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_tier" ADD CONSTRAINT "loyalty_tier_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_benefit" ADD CONSTRAINT "membership_benefit_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_action" ADD CONSTRAINT "membership_action_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr" ADD CONSTRAINT "qr_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr" ADD CONSTRAINT "qr_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr" ADD CONSTRAINT "qr_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr" ADD CONSTRAINT "qr_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_benefit" ADD CONSTRAINT "qr_benefit_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "qr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_action" ADD CONSTRAINT "qr_action_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "qr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_log" ADD CONSTRAINT "referral_log_referrerBusinessId_referrerCustomerId_fkey" FOREIGN KEY ("referrerBusinessId", "referrerCustomerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card" ADD CONSTRAINT "scratch_card_brandingId_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card" ADD CONSTRAINT "scratch_card_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_benefit" ADD CONSTRAINT "scratch_card_benefit_scratchCardId_fkey" FOREIGN KEY ("scratchCardId") REFERENCES "scratch_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_response" ADD CONSTRAINT "scratch_card_response_scratchCardId_fkey" FOREIGN KEY ("scratchCardId") REFERENCES "scratch_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_response" ADD CONSTRAINT "scratch_card_response_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "scratch_card_benefit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_response" ADD CONSTRAINT "scratch_card_response_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_response" ADD CONSTRAINT "scratch_card_response_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratch_card_action" ADD CONSTRAINT "scratch_card_action_scratchCardId_fkey" FOREIGN KEY ("scratchCardId") REFERENCES "scratch_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_loyaltyId_fkey" FOREIGN KEY ("loyaltyId") REFERENCES "loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_qrId_fkey" FOREIGN KEY ("qrId") REFERENCES "qr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_loyaltyTierId_fkey" FOREIGN KEY ("loyaltyTierId") REFERENCES "loyalty_tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_referralProgramNewCustomerId_fkey" FOREIGN KEY ("referralProgramNewCustomerId") REFERENCES "referral_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_referralProgramExistingCustomerId_fkey" FOREIGN KEY ("referralProgramExistingCustomerId") REFERENCES "referral_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier" ADD CONSTRAINT "cashier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier" ADD CONSTRAINT "cashier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
