/*
  Warnings:

  - A unique constraint covering the columns `[feedbackResponseId]` on the table `feedback_link` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "feedback_link" ADD COLUMN     "feedbackResponseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_feedbackResponseId_key" ON "feedback_link"("feedbackResponseId");

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_feedbackResponseId_fkey" FOREIGN KEY ("feedbackResponseId") REFERENCES "feedback_response"("id") ON DELETE SET NULL ON UPDATE CASCADE;
