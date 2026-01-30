/*
  Warnings:

  - You are about to drop the column `referedBonusPoints` on the `business` table. All the data in the column will be lost.
  - You are about to drop the column `referralRewardPoints` on the `business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business" DROP COLUMN "referedBonusPoints",
DROP COLUMN "referralRewardPoints";

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
    "termsAndConditionsNewCustomer" TEXT,
    "termsAndConditionsExistingCustomer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_program_businessId_key" ON "referral_program"("businessId");

-- CreateIndex
CREATE INDEX "referral_program_businessId_idx" ON "referral_program"("businessId");

-- AddForeignKey
ALTER TABLE "referral_program" ADD CONSTRAINT "referral_program_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
