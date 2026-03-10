-- CreateEnum
CREATE TYPE "MonetaryUnit" AS ENUM ('RATIO', 'ABSOLUTE');

-- AlterTable
ALTER TABLE "segment" ADD COLUMN     "monetaryUnit" "MonetaryUnit" DEFAULT 'RATIO';
