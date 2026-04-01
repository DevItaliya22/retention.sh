-- CreateEnum
CREATE TYPE "CampaignRewardType" AS ENUM ('FREE_ITEM', 'PERCENTAGE_DISCOUNT', 'CASH_DISCOUNT', 'NO_REWARD');

-- CreateEnum
CREATE TYPE "LoyaltyType" AS ENUM ('CASHBACK', 'TIER', 'AMOUNT_SPENT', 'VISIT_MADE');

-- CreateEnum
CREATE TYPE "LoyaltyRewardType" AS ENUM ('FREE_ITEM', 'PERCENTAGE_DISCOUNT', 'CASH_DISCOUNT');

-- CreateEnum
CREATE TYPE "VisitIntervalUnit" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "LoyaltyMessageType" AS ENUM ('FIRST_PURCHASE', 'EXPIRE', 'REMINDER', 'SUBSEQUENT_PURCHASE', 'MEMBERSHIP_JOIN');

-- CreateEnum
CREATE TYPE "MembershipBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS', 'NO_DISCOUNT');

-- CreateEnum
CREATE TYPE "BenefitAppliesTo" AS ENUM ('ENTIRE_PURCHASE', 'SPECIFIC_ITEMS');

-- CreateEnum
CREATE TYPE "QrBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS');

-- CreateEnum
CREATE TYPE "ReferalBenefitType" AS ENUM ('AMOUNT_CASHBACK', 'FREE_ITEM_ON_NEXT_PURCHASE');

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
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "AutoCampaignTrigger" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'FIRST_PURCHASE', 'WIN_BACK', 'MEMBERSHIP_EXPIRY', 'POINTS_EXPIRY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'GIFTED', 'ADJUSTMENT', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('BILL', 'FEEDBACK', 'SCRATCH_CARD', 'CAMPAIGN', 'REFERRAL', 'REGISTRATION', 'MANUAL_ADJUSTMENT', 'SHOPIFY_ORDER', 'PARTNER_EXCHANGE');

-- CreateEnum
CREATE TYPE "TransactionValueKind" AS ENUM ('CASHBACK', 'AMOUNT_SPENT_POINTS', 'VISIT_POINTS', 'FREE_ITEM');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('POINTS', 'STORE_CREDIT');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'CASHIER');

-- CreateEnum
CREATE TYPE "SegmentOperator" AS ENUM ('LESS_THAN', 'GREATER_THAN', 'LESS_THAN_OR_EQUAL', 'GREATER_THAN_OR_EQUAL', 'IN_RANGE', 'NOT_IN_RANGE');

-- CreateEnum
CREATE TYPE "RecencyUnit" AS ENUM ('DAYS', 'MONTHS');

-- CreateEnum
CREATE TYPE "MonetaryUnit" AS ENUM ('RATIO', 'ABSOLUTE');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('LOYALTY_OTP', 'LOYALTY_REMINDER', 'LOYALTY_EARN', 'LOYALTY_EXPIRE', 'FEEDBACK_LINK', 'NEGATIVE_FEEDBACK_ALERT', 'REFERRAL_REMINDER', 'REFERRAL_CLAIM', 'MEMBERSHIP_ENROLLMENT', 'CAMPAIGN_APPLIED', 'CAMPAIGN_BROADCAST', 'QR_REWARD_EXPIRE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "PartnerRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'PERMANENTLY_REJECTED');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('ACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "PartnershipEventType" AS ENUM ('REQUEST_SENT', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'REQUEST_PERMANENTLY_REJECTED', 'REQUEST_UN_PERMANENTLY_REJECTED', 'PARTNERSHIP_DISSOLVED', 'SETTINGS_UPDATED', 'SETTINGS_LOCKED', 'SETTINGS_UNLOCK_REQUESTED', 'SETTINGS_UNLOCK_ACCEPTED', 'SETTINGS_UNLOCK_REJECTED');

-- CreateTable
CREATE TABLE "bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION,
    "storeDiscount" DOUBLE PRECISION DEFAULT 0,
    "tax" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "finalAmount" DOUBLE PRECISION,
    "cashbackAmount" DOUBLE PRECISION,
    "cashbackRedeemedAmount" DOUBLE PRECISION,
    "partnerRedeemedAmount" DOUBLE PRECISION,
    "redeemedFromPartnerBusinessId" TEXT,
    "campaignDiscountAmount" DOUBLE PRECISION,
    "campaignId" TEXT,
    "userPaidAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "paymentMethod" TEXT,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cashierId" TEXT,
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
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "defaultPointsName" TEXT NOT NULL DEFAULT 'Points',
    "defaultCurrencySymbol" TEXT NOT NULL DEFAULT '₹',
    "defaultCurrencyCode" TEXT NOT NULL DEFAULT 'INR',
    "useDefaultBrandingForServices" BOOLEAN NOT NULL DEFAULT false,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "registrationBonusPoints" INTEGER NOT NULL DEFAULT 0,
    "nextBillNumber" INTEGER NOT NULL DEFAULT 1,
    "isServiceEnabled" JSONB,
    "receivePartnershipOffers" BOOLEAN NOT NULL DEFAULT false,
    "maxPartnerAllowed" INTEGER NOT NULL DEFAULT 1,
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
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "contactNumber" TEXT,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "emailSubject" TEXT,
    "themeColor" TEXT,
    "textColor" TEXT,
    "logo" TEXT,
    "bannerImage" TEXT,
    "rewardType" "CampaignRewardType" NOT NULL DEFAULT 'FREE_ITEM',
    "rewardValue" TEXT,
    "offerStatement" TEXT,
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
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "targetAudiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "messageScheduledAt" TIMESTAMP(3),
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_customer_pkey" PRIMARY KEY ("businessId","customerId")
);

-- CreateTable
CREATE TABLE "feedback_config" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
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
CREATE TABLE "feedback_selection_option" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_selection_option_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "feedback_link" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "configId" TEXT,
    "feedbackResponseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty" (
    "id" TEXT NOT NULL,
    "loyaltyType" "LoyaltyType" NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandingId" TEXT,
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
    "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_cashback_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tier_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "pointsPerRupee" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "onFinalAmount" BOOLEAN NOT NULL DEFAULT false,
    "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tier_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_tier" (
    "id" TEXT NOT NULL,
    "tierConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "minLifetimeSpend" DOUBLE PRECISION NOT NULL,
    "maxLifetimeSpend" DOUBLE PRECISION,
    "cashbackPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minPurchaseForRedemptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minPurchaseForRedemption" DOUBLE PRECISION,
    "maxCashbackCapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxCashbackCap" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_amount_spent_config" (
    "id" TEXT NOT NULL,
    "loyaltyId" TEXT NOT NULL,
    "pointsPerRupee" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "onFinalAmount" BOOLEAN NOT NULL DEFAULT false,
    "maxPointsPerPurchase" INTEGER,
    "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT true,
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
    "allowSameBillRedemption" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'DRAFT',
    "brandingId" TEXT,
    "marketingSlug" TEXT NOT NULL,
    "platformConvenienceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentGatewayCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessReceives" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
CREATE TABLE "customer_membership" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_membership_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "message_log" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "source" "MessageSource" NOT NULL,
    "sourceId" TEXT,
    "campaignId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_log_pkey" PRIMARY KEY ("id")
);

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
    "settingsLocked" BOOLEAN NOT NULL DEFAULT false,
    "settingsLockedByBusinessId" TEXT,
    "unlockRequestByBusinessId" TEXT,
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

-- CreateTable
CREATE TABLE "partnership_event_log" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT,
    "partnerRequestId" TEXT,
    "actorBusinessId" TEXT NOT NULL,
    "event" "PartnershipEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_event_log_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "maxTries" INTEGER NOT NULL,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "windowExpiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_program" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "newCustomerBenefitType" "ReferalBenefitType" NOT NULL,
    "newCustomerBenefitValue" INTEGER NOT NULL,
    "newCustomerBenefitExpiresInDays" INTEGER,
    "newCustomerFreeItemSkuId" TEXT,
    "existingCustomerBenefitType" "ReferalBenefitType" NOT NULL,
    "existingCustomerBenefitValue" INTEGER NOT NULL,
    "existingCustomerBenefitExpiresInDays" INTEGER,
    "existingCustomerFreeItemSkuId" TEXT,
    "sendReminderToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lockReferralPointsUntilFirstPurchase" BOOLEAN NOT NULL DEFAULT true,
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
    "referredBusinessId" TEXT,
    "referredCustomerId" TEXT,
    "referrerRewardUnlockedAt" TIMESTAMP(3),
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
CREATE TABLE "segment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "proTip" TEXT,
    "recencyOperator" "SegmentOperator",
    "recencyValue" DOUBLE PRECISION,
    "recencyValue2" DOUBLE PRECISION,
    "recencyUnit" "RecencyUnit" DEFAULT 'DAYS',
    "frequencyOperator" "SegmentOperator",
    "frequencyValue" INTEGER,
    "frequencyValue2" INTEGER,
    "monetaryUnit" "MonetaryUnit" DEFAULT 'RATIO',
    "monetaryOperator" "SegmentOperator",
    "monetaryValue" DOUBLE PRECISION,
    "monetaryValue2" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_store" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopName" TEXT,
    "accessToken" TEXT NOT NULL,
    "scope" TEXT,
    "webhookSecret" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "returnWindowDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_order" (
    "id" TEXT NOT NULL,
    "shopifyStoreId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "fulfillmentStatus" TEXT,
    "financialStatus" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "returnWindowEndsAt" TIMESTAMP(3),
    "loyaltyGrantedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_sync" (
    "id" TEXT NOT NULL,
    "shopifyStoreId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_sync_pkey" PRIMARY KEY ("id")
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
    "campaignId" TEXT,
    "shopifyOrderId" TEXT,
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
    "freeItems" JSONB DEFAULT '[]',
    "lifetimeSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
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
    "email" TEXT NOT NULL,
    "cashierLinkSlug" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateTable
CREATE TABLE "_FeedbackResponseToFeedbackSelectionOption" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FeedbackResponseToFeedbackSelectionOption_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "bill_businessId_idx" ON "bill"("businessId");

-- CreateIndex
CREATE INDEX "bill_customerId_idx" ON "bill"("customerId");

-- CreateIndex
CREATE INDEX "bill_cashierId_idx" ON "bill"("cashierId");

-- CreateIndex
CREATE INDEX "bill_campaignId_idx" ON "bill"("campaignId");

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
CREATE UNIQUE INDEX "campaign_slug_key" ON "campaign"("slug");

-- CreateIndex
CREATE INDEX "campaign_businessId_idx" ON "campaign"("businessId");

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
CREATE INDEX "business_customer_slugId_idx" ON "business_customer"("slugId");

-- CreateIndex
CREATE INDEX "business_customer_customerId_idx" ON "business_customer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_config_businessId_key" ON "feedback_config"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_config_brandingId_key" ON "feedback_config"("brandingId");

-- CreateIndex
CREATE INDEX "feedback_config_businessId_idx" ON "feedback_config"("businessId");

-- CreateIndex
CREATE INDEX "feedback_question_configId_idx" ON "feedback_question"("configId");

-- CreateIndex
CREATE INDEX "feedback_category_configId_idx" ON "feedback_category"("configId");

-- CreateIndex
CREATE INDEX "how_did_you_hear_option_configId_idx" ON "how_did_you_hear_option"("configId");

-- CreateIndex
CREATE INDEX "feedback_selection_option_configId_idx" ON "feedback_selection_option"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_selection_option_configId_label_key" ON "feedback_selection_option"("configId", "label");

-- CreateIndex
CREATE INDEX "feedback_response_configId_idx" ON "feedback_response"("configId");

-- CreateIndex
CREATE INDEX "feedback_response_customerId_idx" ON "feedback_response"("customerId");

-- CreateIndex
CREATE INDEX "feedback_response_businessId_rating_idx" ON "feedback_response"("businessId", "rating");

-- CreateIndex
CREATE INDEX "feedback_response_businessId_customerId_idx" ON "feedback_response"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_token_key" ON "feedback_link"("token");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_billId_key" ON "feedback_link"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_feedbackResponseId_key" ON "feedback_link"("feedbackResponseId");

-- CreateIndex
CREATE INDEX "feedback_link_billId_idx" ON "feedback_link"("billId");

-- CreateIndex
CREATE INDEX "feedback_link_configId_idx" ON "feedback_link"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_businessId_key" ON "loyalty"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_brandingId_key" ON "loyalty"("brandingId");

-- CreateIndex
CREATE INDEX "loyalty_businessId_idx" ON "loyalty"("businessId");

-- CreateIndex
CREATE INDEX "loyalty_loyaltyType_idx" ON "loyalty"("loyaltyType");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_cashback_config_loyaltyId_key" ON "loyalty_cashback_config"("loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tier_config_loyaltyId_key" ON "loyalty_tier_config"("loyaltyId");

-- CreateIndex
CREATE INDEX "loyalty_tier_tierConfigId_idx" ON "loyalty_tier"("tierConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_amount_spent_config_loyaltyId_key" ON "loyalty_amount_spent_config"("loyaltyId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_visit_made_config_loyaltyId_key" ON "loyalty_visit_made_config"("loyaltyId");

-- CreateIndex
CREATE INDEX "loyalty_reward_stage_amountSpentConfigId_idx" ON "loyalty_reward_stage"("amountSpentConfigId");

-- CreateIndex
CREATE INDEX "loyalty_reward_stage_visitMadeConfigId_idx" ON "loyalty_reward_stage"("visitMadeConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_brandingId_key" ON "membership"("brandingId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_marketingSlug_key" ON "membership"("marketingSlug");

-- CreateIndex
CREATE INDEX "membership_businessId_idx" ON "membership"("businessId");

-- CreateIndex
CREATE INDEX "membership_marketingSlug_idx" ON "membership"("marketingSlug");

-- CreateIndex
CREATE INDEX "customer_membership_membershipId_idx" ON "customer_membership"("membershipId");

-- CreateIndex
CREATE INDEX "customer_membership_businessId_customerId_idx" ON "customer_membership"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_membership_businessId_customerId_membershipId_key" ON "customer_membership"("businessId", "customerId", "membershipId");

-- CreateIndex
CREATE INDEX "membership_benefit_membershipId_idx" ON "membership_benefit"("membershipId");

-- CreateIndex
CREATE INDEX "membership_action_membershipId_idx" ON "membership_action"("membershipId");

-- CreateIndex
CREATE INDEX "message_log_businessId_idx" ON "message_log"("businessId");

-- CreateIndex
CREATE INDEX "message_log_status_idx" ON "message_log"("status");

-- CreateIndex
CREATE INDEX "message_log_source_idx" ON "message_log"("source");

-- CreateIndex
CREATE INDEX "message_log_campaignId_idx" ON "message_log"("campaignId");

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

-- CreateIndex
CREATE INDEX "partnership_event_log_partnershipId_idx" ON "partnership_event_log"("partnershipId");

-- CreateIndex
CREATE INDEX "partnership_event_log_partnerRequestId_idx" ON "partnership_event_log"("partnerRequestId");

-- CreateIndex
CREATE INDEX "partnership_event_log_actorBusinessId_idx" ON "partnership_event_log"("actorBusinessId");

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
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "rate_limit_key_idx" ON "rate_limit"("key");

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
CREATE INDEX "segment_businessId_idx" ON "segment"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "segment_businessId_name_key" ON "segment"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "segment_businessId_slug_key" ON "segment"("businessId", "slug");

-- CreateIndex
CREATE INDEX "shopify_store_businessId_idx" ON "shopify_store"("businessId");

-- CreateIndex
CREATE INDEX "shopify_store_shopDomain_idx" ON "shopify_store"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_store_businessId_shopDomain_key" ON "shopify_store"("businessId", "shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_order_billId_key" ON "shopify_order"("billId");

-- CreateIndex
CREATE INDEX "shopify_order_businessId_idx" ON "shopify_order"("businessId");

-- CreateIndex
CREATE INDEX "shopify_order_customerId_idx" ON "shopify_order"("customerId");

-- CreateIndex
CREATE INDEX "shopify_order_returnWindowEndsAt_idx" ON "shopify_order"("returnWindowEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_order_shopifyStoreId_shopifyOrderId_key" ON "shopify_order"("shopifyStoreId", "shopifyOrderId");

-- CreateIndex
CREATE INDEX "shopify_product_sync_shopifyStoreId_idx" ON "shopify_product_sync"("shopifyStoreId");

-- CreateIndex
CREATE INDEX "shopify_product_sync_skuId_idx" ON "shopify_product_sync"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_sync_shopifyStoreId_skuId_key" ON "shopify_product_sync"("shopifyStoreId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_sync_shopifyStoreId_shopifyProductId_shopif_key" ON "shopify_product_sync"("shopifyStoreId", "shopifyProductId", "shopifyVariantId");

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
CREATE INDEX "transaction_shopifyOrderId_idx" ON "transaction"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "transaction_campaignId_idx" ON "transaction"("campaignId");

-- CreateIndex
CREATE INDEX "wallet_businessId_customerId_idx" ON "wallet"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_businessId_customerId_key" ON "wallet"("businessId", "customerId");

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
CREATE UNIQUE INDEX "cashier_businessId_email_key" ON "cashier"("businessId", "email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "_FeedbackResponseToFeedbackSelectionOption_B_index" ON "_FeedbackResponseToFeedbackSelectionOption"("B");

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "cashier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_customer" ADD CONSTRAINT "business_customer_referredByBusinessId_referredByCustomerI_fkey" FOREIGN KEY ("referredByBusinessId", "referredByCustomerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_config" ADD CONSTRAINT "feedback_config_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_config" ADD CONSTRAINT "feedback_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_question" ADD CONSTRAINT "feedback_question_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_category" ADD CONSTRAINT "feedback_category_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "how_did_you_hear_option" ADD CONSTRAINT "how_did_you_hear_option_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_selection_option" ADD CONSTRAINT "feedback_selection_option_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "feedback_response_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_response" ADD CONSTRAINT "feedback_response_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_feedbackResponseId_fkey" FOREIGN KEY ("feedbackResponseId") REFERENCES "feedback_response"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty" ADD CONSTRAINT "loyalty_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_branding_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_membership" ADD CONSTRAINT "customer_membership_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_membership" ADD CONSTRAINT "customer_membership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_benefit" ADD CONSTRAINT "membership_benefit_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_action" ADD CONSTRAINT "membership_action_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "business_partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_partnerRequestId_fkey" FOREIGN KEY ("partnerRequestId") REFERENCES "partner_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_actorBusinessId_fkey" FOREIGN KEY ("actorBusinessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_newCustomerFreeItemSkuId_fkey" FOREIGN KEY ("newCustomerFreeItemSkuId") REFERENCES "sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_existingCustomerFreeItemSkuId_fkey" FOREIGN KEY ("existingCustomerFreeItemSkuId") REFERENCES "sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "segment" ADD CONSTRAINT "segment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_store" ADD CONSTRAINT "shopify_store_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_order" ADD CONSTRAINT "shopify_order_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "shopify_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_order" ADD CONSTRAINT "shopify_order_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_sync" ADD CONSTRAINT "shopify_product_sync_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "shopify_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_sync" ADD CONSTRAINT "shopify_product_sync_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "shopify_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "_FeedbackResponseToFeedbackSelectionOption" ADD CONSTRAINT "_FeedbackResponseToFeedbackSelectionOption_A_fkey" FOREIGN KEY ("A") REFERENCES "feedback_response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackResponseToFeedbackSelectionOption" ADD CONSTRAINT "_FeedbackResponseToFeedbackSelectionOption_B_fkey" FOREIGN KEY ("B") REFERENCES "feedback_selection_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
