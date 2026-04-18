-- Games of chance: enums, tables, transaction link

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('SPIN_WHEEL', 'LOTTERY', 'SCRATCH_CARD');

-- CreateEnum
CREATE TYPE "GameCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GameEligibilityEventType" AS ENUM ('BILL_CREATED', 'VISIT_QUALIFIED', 'REFERRAL_COMPLETED', 'CAMPAIGN_ACTION', 'MANUAL_GRANT', 'CUSTOM_EVENT');

-- CreateEnum
CREATE TYPE "GameDistributionMode" AS ENUM ('PROBABILITY_WEIGHTED', 'POPULATION_RATIO', 'FIXED_WINNER_COUNT', 'FIRST_N');

-- CreateEnum
CREATE TYPE "GameFulfillmentMode" AS ENUM ('INSTANT', 'SCHEDULED_DRAW');

-- CreateEnum
CREATE TYPE "GameAttemptOutcome" AS ENUM ('WON', 'NOT_WON', 'INELIGIBLE', 'RATE_LIMITED', 'EXHAUSTED', 'DRAW_PENDING');

-- CreateEnum
CREATE TYPE "GameRewardKind" AS ENUM ('NONE', 'LOYALTY_POINTS', 'CASHBACK', 'FREE_ITEM', 'PERCENTAGE_DISCOUNT', 'VOUCHER_CODE');

-- CreateEnum
CREATE TYPE "GameFulfillmentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'FULFILLED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameDrawBatchStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'GAME_CAMPAIGN';

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN "gameCampaignId" TEXT;
ALTER TABLE "transaction" ADD COLUMN "gameAllocationId" TEXT;

-- CreateTable
CREATE TABLE "game_campaign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "GameCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "fulfillmentMode" "GameFulfillmentMode" NOT NULL DEFAULT 'INSTANT',
    "drawAt" TIMESTAMP(3),
    "drawWindowStart" TIMESTAMP(3),
    "drawWindowEnd" TIMESTAMP(3),
    "legacyScratchCardId" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_eligibility_rule" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "eventType" "GameEligibilityEventType" NOT NULL,
    "eventFilterJson" JSONB,
    "intervalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "intervalValue" INTEGER,
    "intervalUnit" "VisitIntervalUnit",
    "maxAttemptsPerUserPerInterval" INTEGER,
    "globalAttemptCap" INTEGER,
    "firstNEligibleUsers" INTEGER,
    "segmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_eligibility_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_distribution_policy" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "mode" "GameDistributionMode" NOT NULL DEFAULT 'PROBABILITY_WEIGHTED',
    "populationWindowSize" INTEGER,
    "populationWinnerCount" INTEGER,
    "maxWinnersTotal" INTEGER,
    "randomSeedVersion" INTEGER NOT NULL DEFAULT 1,
    "strictInventoryMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_distribution_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_reward" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "kind" "GameRewardKind" NOT NULL DEFAULT 'NONE',
    "displayName" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "probabilityPercent" DOUBLE PRECISION,
    "maxWinners" INTEGER,
    "stock" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isFallbackNoReward" BOOLEAN NOT NULL DEFAULT false,
    "freeItemSkuId" TEXT,
    "pointsAmount" INTEGER,
    "cashbackAmount" DOUBLE PRECISION,
    "percentageValue" DOUBLE PRECISION,
    "voucherCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_attempt" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "triggerEventType" "GameEligibilityEventType" NOT NULL,
    "triggerEventId" TEXT NOT NULL,
    "billId" TEXT,
    "attemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptOrdinal" INTEGER NOT NULL DEFAULT 0,
    "eligibilitySnapshotJson" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_allocation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "outcome" "GameAttemptOutcome" NOT NULL,
    "rewardId" TEXT,
    "allocationReason" TEXT,
    "policySnapshotJson" JSONB,
    "rngTraceJson" JSONB,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_fulfillment" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "mode" "GameFulfillmentMode" NOT NULL,
    "status" "GameFulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "deliveryChannel" TEXT,
    "deliveryRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_draw_batch" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "status" "GameDrawBatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "inputHash" TEXT,
    "winnerCount" INTEGER,
    "executionLogJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_draw_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_draw_entry" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "drawBatchId" TEXT,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sourceAttemptId" TEXT,
    "entryCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_draw_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_draw_winner" (
    "id" TEXT NOT NULL,
    "drawBatchId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "notifiedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_draw_winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_analytics_daily" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "winnersCount" INTEGER NOT NULL DEFAULT 0,
    "notWonCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitedCount" INTEGER NOT NULL DEFAULT 0,
    "rewardCostEstimate" DOUBLE PRECISION,
    "fraudFlagCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_audit_log" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "businessId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "requestId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_audit_log_pkey" PRIMARY KEY ("id")
);

-- UniqueIndexes
CREATE UNIQUE INDEX "game_campaign_legacyScratchCardId_key" ON "game_campaign"("legacyScratchCardId");
CREATE UNIQUE INDEX "game_campaign_businessId_slug_key" ON "game_campaign"("businessId", "slug");
CREATE UNIQUE INDEX "game_eligibility_rule_campaignId_eventType_key" ON "game_eligibility_rule"("campaignId", "eventType");
CREATE UNIQUE INDEX "game_distribution_policy_campaignId_key" ON "game_distribution_policy"("campaignId");
CREATE UNIQUE INDEX "game_attempt_campaignId_customerId_triggerEventType_triggerEventId_key" ON "game_attempt"("campaignId", "customerId", "triggerEventType", "triggerEventId");
CREATE UNIQUE INDEX "game_attempt_campaignId_idempotencyKey_key" ON "game_attempt"("campaignId", "idempotencyKey");
CREATE UNIQUE INDEX "game_allocation_attemptId_key" ON "game_allocation"("attemptId");
CREATE UNIQUE INDEX "game_fulfillment_allocationId_key" ON "game_fulfillment"("allocationId");
CREATE UNIQUE INDEX "game_analytics_daily_campaignId_day_key" ON "game_analytics_daily"("campaignId", "day");
CREATE UNIQUE INDEX "transaction_gameAllocationId_key" ON "transaction"("gameAllocationId");

-- CreateIndex
CREATE INDEX "game_campaign_businessId_idx" ON "game_campaign"("businessId");
CREATE INDEX "game_campaign_businessId_status_idx" ON "game_campaign"("businessId", "status");
CREATE INDEX "game_eligibility_rule_campaignId_idx" ON "game_eligibility_rule"("campaignId");
CREATE INDEX "game_eligibility_rule_segmentId_idx" ON "game_eligibility_rule"("segmentId");
CREATE INDEX "game_reward_campaignId_idx" ON "game_reward"("campaignId");
CREATE INDEX "game_attempt_businessId_customerId_idx" ON "game_attempt"("businessId", "customerId");
CREATE INDEX "game_attempt_campaignId_attemptAt_idx" ON "game_attempt"("campaignId", "attemptAt");
CREATE INDEX "game_attempt_billId_idx" ON "game_attempt"("billId");
CREATE INDEX "game_allocation_outcome_idx" ON "game_allocation"("outcome");
CREATE INDEX "game_allocation_rewardId_idx" ON "game_allocation"("rewardId");
CREATE INDEX "game_fulfillment_status_scheduledFor_idx" ON "game_fulfillment"("status", "scheduledFor");
CREATE INDEX "game_draw_batch_campaignId_scheduledAt_idx" ON "game_draw_batch"("campaignId", "scheduledAt");
CREATE INDEX "game_draw_batch_status_idx" ON "game_draw_batch"("status");
CREATE INDEX "game_draw_entry_campaignId_customerId_idx" ON "game_draw_entry"("campaignId", "customerId");
CREATE INDEX "game_draw_entry_sourceAttemptId_idx" ON "game_draw_entry"("sourceAttemptId");
CREATE INDEX "game_draw_entry_drawBatchId_idx" ON "game_draw_entry"("drawBatchId");
CREATE INDEX "game_draw_winner_drawBatchId_idx" ON "game_draw_winner"("drawBatchId");
CREATE INDEX "game_draw_winner_businessId_customerId_idx" ON "game_draw_winner"("businessId", "customerId");
CREATE INDEX "game_analytics_daily_campaignId_idx" ON "game_analytics_daily"("campaignId");
CREATE INDEX "game_audit_log_businessId_createdAt_idx" ON "game_audit_log"("businessId", "createdAt");
CREATE INDEX "game_audit_log_campaignId_idx" ON "game_audit_log"("campaignId");
CREATE INDEX "transaction_gameCampaignId_idx" ON "transaction"("gameCampaignId");

-- AddForeignKey
ALTER TABLE "game_campaign" ADD CONSTRAINT "game_campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_eligibility_rule" ADD CONSTRAINT "game_eligibility_rule_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_eligibility_rule" ADD CONSTRAINT "game_eligibility_rule_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_distribution_policy" ADD CONSTRAINT "game_distribution_policy_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_reward" ADD CONSTRAINT "game_reward_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_reward" ADD CONSTRAINT "game_reward_freeItemSkuId_fkey" FOREIGN KEY ("freeItemSkuId") REFERENCES "sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_attempt" ADD CONSTRAINT "game_attempt_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_attempt" ADD CONSTRAINT "game_attempt_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_attempt" ADD CONSTRAINT "game_attempt_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_allocation" ADD CONSTRAINT "game_allocation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "game_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_allocation" ADD CONSTRAINT "game_allocation_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "game_reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_fulfillment" ADD CONSTRAINT "game_fulfillment_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "game_allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_draw_batch" ADD CONSTRAINT "game_draw_batch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_draw_entry" ADD CONSTRAINT "game_draw_entry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_draw_entry" ADD CONSTRAINT "game_draw_entry_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_draw_entry" ADD CONSTRAINT "game_draw_entry_sourceAttemptId_fkey" FOREIGN KEY ("sourceAttemptId") REFERENCES "game_attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "game_draw_entry" ADD CONSTRAINT "game_draw_entry_drawBatchId_fkey" FOREIGN KEY ("drawBatchId") REFERENCES "game_draw_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_draw_winner" ADD CONSTRAINT "game_draw_winner_drawBatchId_fkey" FOREIGN KEY ("drawBatchId") REFERENCES "game_draw_batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_draw_winner" ADD CONSTRAINT "game_draw_winner_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "game_reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_analytics_daily" ADD CONSTRAINT "game_analytics_daily_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_audit_log" ADD CONSTRAINT "game_audit_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "game_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction" ADD CONSTRAINT "transaction_gameCampaignId_fkey" FOREIGN KEY ("gameCampaignId") REFERENCES "game_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_gameAllocationId_fkey" FOREIGN KEY ("gameAllocationId") REFERENCES "game_allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
