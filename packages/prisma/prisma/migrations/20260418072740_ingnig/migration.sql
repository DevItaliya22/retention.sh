-- CreateIndex
CREATE INDEX "transaction_gameAllocationId_idx" ON "transaction"("gameAllocationId");

-- RenameIndex
ALTER INDEX "game_attempt_campaignId_customerId_triggerEventType_triggerEven" RENAME TO "game_attempt_campaignId_customerId_triggerEventType_trigger_key";
