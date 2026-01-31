/*
  Warnings:

  - A unique constraint covering the columns `[businessId,email]` on the table `cashier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `cashier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cashier" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cashier_businessId_email_key" ON "cashier"("businessId", "email");
