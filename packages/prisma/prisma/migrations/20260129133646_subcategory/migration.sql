-- CreateEnum
CREATE TYPE "ReferalBenefitType" AS ENUM ('CASH_DISCOUNT', 'PERCENTAGE_DISCOUNT', 'FREE_ITEM', 'LOYALTY_BONUS');

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
