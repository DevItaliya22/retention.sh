/*
  Warnings:

  - You are about to drop the column `termsAndConditionsExistingCustomer` on the `referral_program` table. All the data in the column will be lost.
  - You are about to drop the column `termsAndConditionsNewCustomer` on the `referral_program` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[content,referralProgramNewCustomerId]` on the table `terms_and_conditions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[content,referralProgramExistingCustomerId]` on the table `terms_and_conditions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "referral_program" DROP COLUMN "termsAndConditionsExistingCustomer",
DROP COLUMN "termsAndConditionsNewCustomer";

-- AlterTable
ALTER TABLE "terms_and_conditions" ADD COLUMN     "referralProgramExistingCustomerId" TEXT,
ADD COLUMN     "referralProgramNewCustomerId" TEXT;

-- CreateIndex
CREATE INDEX "terms_and_conditions_referralProgramNewCustomerId_idx" ON "terms_and_conditions"("referralProgramNewCustomerId");

-- CreateIndex
CREATE INDEX "terms_and_conditions_referralProgramExistingCustomerId_idx" ON "terms_and_conditions"("referralProgramExistingCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_referralProgramNewCustomerId_key" ON "terms_and_conditions"("content", "referralProgramNewCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "terms_and_conditions_content_referralProgramExistingCustome_key" ON "terms_and_conditions"("content", "referralProgramExistingCustomerId");

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_referralProgramNewCustomerId_fkey" FOREIGN KEY ("referralProgramNewCustomerId") REFERENCES "referral_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_referralProgramExistingCustomerId_fkey" FOREIGN KEY ("referralProgramExistingCustomerId") REFERENCES "referral_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
