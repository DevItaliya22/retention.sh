/*
  Warnings:

  - You are about to drop the column `convenienceFee` on the `membership` table. All the data in the column will be lost.
  - You are about to drop the column `userReceives` on the `membership` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('LOYALTY_OTP', 'LOYALTY_REMINDER', 'LOYALTY_EARN', 'LOYALTY_EXPIRE', 'FEEDBACK_LINK', 'NEGATIVE_FEEDBACK_ALERT', 'REFERRAL_REMINDER', 'MEMBERSHIP_ENROLLMENT', 'CAMPAIGN_APPLIED', 'QR_REWARD_EXPIRE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "membership" DROP COLUMN "convenienceFee",
DROP COLUMN "userReceives",
ADD COLUMN     "businessReceives" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "platformConvenienceFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

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
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_log_businessId_idx" ON "message_log"("businessId");

-- CreateIndex
CREATE INDEX "message_log_status_idx" ON "message_log"("status");

-- CreateIndex
CREATE INDEX "message_log_source_idx" ON "message_log"("source");

-- AddForeignKey
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
