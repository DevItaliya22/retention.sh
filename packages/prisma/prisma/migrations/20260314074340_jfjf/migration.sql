/*
  Warnings:

  - You are about to drop the `campaign_segment` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "MessageSource" ADD VALUE 'CAMPAIGN_BROADCAST';

-- DropForeignKey
ALTER TABLE "campaign_segment" DROP CONSTRAINT "campaign_segment_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "campaign_segment" DROP CONSTRAINT "campaign_segment_segmentId_fkey";

-- AlterTable
ALTER TABLE "campaign" ADD COLUMN     "messageScheduledAt" TIMESTAMP(3),
ADD COLUMN     "targetAudiences" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "message_log" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "campaign_segment";

-- CreateIndex
CREATE INDEX "message_log_campaignId_idx" ON "message_log"("campaignId");

-- AddForeignKey
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
