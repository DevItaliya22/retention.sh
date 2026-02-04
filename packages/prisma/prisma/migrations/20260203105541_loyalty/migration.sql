-- AlterTable
ALTER TABLE "bill" ADD COLUMN     "finalAmount" DOUBLE PRECISION,
ADD COLUMN     "loyaltyPointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsRedeemed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "points_transaction" ADD COLUMN     "balanceAfter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sourceId" TEXT;

-- CreateTable
CREATE TABLE "points_bucket" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "earnedTransactionId" TEXT NOT NULL,
    "originalAmount" INTEGER NOT NULL,
    "remainingAmount" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_bucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_redemption_allocation" (
    "id" TEXT NOT NULL,
    "redeemTransactionId" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_redemption_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_bucket_businessId_customerId_expiresAt_idx" ON "points_bucket"("businessId", "customerId", "expiresAt");

-- CreateIndex
CREATE INDEX "points_bucket_remainingAmount_idx" ON "points_bucket"("remainingAmount");

-- CreateIndex
CREATE INDEX "points_redemption_allocation_redeemTransactionId_idx" ON "points_redemption_allocation"("redeemTransactionId");

-- CreateIndex
CREATE INDEX "points_redemption_allocation_bucketId_idx" ON "points_redemption_allocation"("bucketId");

-- CreateIndex
CREATE INDEX "points_transaction_businessId_customerId_createdAt_idx" ON "points_transaction"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "points_transaction_source_sourceId_idx" ON "points_transaction"("source", "sourceId");

-- CreateIndex
CREATE INDEX "points_transaction_expiresAt_idx" ON "points_transaction"("expiresAt");

-- AddForeignKey
ALTER TABLE "points_bucket" ADD CONSTRAINT "points_bucket_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_bucket" ADD CONSTRAINT "points_bucket_earnedTransactionId_fkey" FOREIGN KEY ("earnedTransactionId") REFERENCES "points_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_redemption_allocation" ADD CONSTRAINT "points_redemption_allocation_redeemTransactionId_fkey" FOREIGN KEY ("redeemTransactionId") REFERENCES "points_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_redemption_allocation" ADD CONSTRAINT "points_redemption_allocation_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "points_bucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
