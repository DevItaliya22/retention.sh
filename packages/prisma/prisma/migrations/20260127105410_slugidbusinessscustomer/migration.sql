/*
  Warnings:

  - A unique constraint covering the columns `[slugId]` on the table `business_customer` will be added. If there are existing duplicate values, this will fail.
  - The required column `slugId` was added to the `business_customer` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "business_customer" ADD COLUMN     "slugId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "business_customer_slugId_key" ON "business_customer"("slugId");

-- CreateIndex
CREATE INDEX "business_customer_slugId_idx" ON "business_customer"("slugId");
