-- AlterEnum
ALTER TYPE "CashbackSource" ADD VALUE 'REDEEMED';

-- AlterTable
ALTER TABLE "bill" ADD COLUMN     "cashbackRedeemedAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "business_customer" ADD COLUMN     "totalCashbackRedeemed" DOUBLE PRECISION NOT NULL DEFAULT 0;
