-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'REGISTRATION';

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "registrationBonusPoints" INTEGER NOT NULL DEFAULT 0;
