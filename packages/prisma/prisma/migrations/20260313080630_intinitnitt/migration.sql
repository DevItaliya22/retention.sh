-- CreateEnum
CREATE TYPE "PartnershipEventType" AS ENUM ('REQUEST_SENT', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'REQUEST_PERMANENTLY_REJECTED', 'REQUEST_UN_PERMANENTLY_REJECTED', 'PARTNERSHIP_DISSOLVED', 'SETTINGS_UPDATED', 'SETTINGS_LOCKED', 'SETTINGS_UNLOCK_REQUESTED', 'SETTINGS_UNLOCK_ACCEPTED', 'SETTINGS_UNLOCK_REJECTED');

-- AlterTable
ALTER TABLE "business_partnership" ADD COLUMN     "settingsLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settingsLockedByBusinessId" TEXT,
ADD COLUMN     "unlockRequestByBusinessId" TEXT;

-- CreateTable
CREATE TABLE "partnership_event_log" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT,
    "partnerRequestId" TEXT,
    "actorBusinessId" TEXT NOT NULL,
    "event" "PartnershipEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partnership_event_log_partnershipId_idx" ON "partnership_event_log"("partnershipId");

-- CreateIndex
CREATE INDEX "partnership_event_log_partnerRequestId_idx" ON "partnership_event_log"("partnerRequestId");

-- CreateIndex
CREATE INDEX "partnership_event_log_actorBusinessId_idx" ON "partnership_event_log"("actorBusinessId");

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "business_partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_partnerRequestId_fkey" FOREIGN KEY ("partnerRequestId") REFERENCES "partner_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_event_log" ADD CONSTRAINT "partnership_event_log_actorBusinessId_fkey" FOREIGN KEY ("actorBusinessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
