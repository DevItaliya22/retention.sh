-- AlterTable
ALTER TABLE "membership" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

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
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "maxTries" INTEGER NOT NULL,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "windowExpiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_membership_membershipId_idx" ON "customer_membership"("membershipId");

-- CreateIndex
CREATE INDEX "customer_membership_businessId_customerId_idx" ON "customer_membership"("businessId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_membership_businessId_customerId_membershipId_key" ON "customer_membership"("businessId", "customerId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "rate_limit_key_idx" ON "rate_limit"("key");

-- AddForeignKey
ALTER TABLE "customer_membership" ADD CONSTRAINT "customer_membership_businessId_customerId_fkey" FOREIGN KEY ("businessId", "customerId") REFERENCES "business_customer"("businessId", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_membership" ADD CONSTRAINT "customer_membership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
