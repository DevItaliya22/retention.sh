/*
  Warnings:

  - You are about to drop the column `amount` on the `bill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bill" DROP COLUMN "amount",
ADD COLUMN     "storeDiscount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tax" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "userPaidAmount" DOUBLE PRECISION;
