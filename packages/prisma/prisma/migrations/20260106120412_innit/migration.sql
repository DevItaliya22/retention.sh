/*
  Warnings:

  - You are about to drop the column `loyaltyProgramId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `LoyaltyProgram` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_loyaltyProgramId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "loyaltyProgramId";

-- DropTable
DROP TABLE "LoyaltyProgram";
