/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `feedback_config` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "feedback_config" ADD COLUMN     "businessId" TEXT;

-- CreateTable
CREATE TABLE "feedback_link" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "configId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_token_key" ON "feedback_link"("token");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_link_billId_key" ON "feedback_link"("billId");

-- CreateIndex
CREATE INDEX "feedback_link_billId_idx" ON "feedback_link"("billId");

-- CreateIndex
CREATE INDEX "feedback_link_configId_idx" ON "feedback_link"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_config_businessId_key" ON "feedback_config"("businessId");

-- CreateIndex
CREATE INDEX "feedback_config_businessId_idx" ON "feedback_config"("businessId");

-- AddForeignKey
ALTER TABLE "feedback_config" ADD CONSTRAINT "feedback_config_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_link" ADD CONSTRAINT "feedback_link_configId_fkey" FOREIGN KEY ("configId") REFERENCES "feedback_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
