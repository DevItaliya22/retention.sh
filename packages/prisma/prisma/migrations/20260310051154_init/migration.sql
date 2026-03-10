/*
  Warnings:

  - You are about to drop the column `targetCustomerTags` on the `campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "campaign" DROP COLUMN "targetCustomerTags";

-- CreateTable
CREATE TABLE "campaign_segment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_segment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_segment_campaignId_idx" ON "campaign_segment"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_segment_segmentId_idx" ON "campaign_segment"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_segment_campaignId_segmentId_key" ON "campaign_segment"("campaignId", "segmentId");

-- AddForeignKey
ALTER TABLE "campaign_segment" ADD CONSTRAINT "campaign_segment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_segment" ADD CONSTRAINT "campaign_segment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
