-- CreateIndex
CREATE INDEX "feedback_response_businessId_rating_idx" ON "feedback_response"("businessId", "rating");

-- CreateIndex
CREATE INDEX "feedback_response_businessId_customerId_idx" ON "feedback_response"("businessId", "customerId");
