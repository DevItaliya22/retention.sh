/*
  Warnings:

  - You are about to drop the column `name` on the `campaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `campaign` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[brandingId]` on the table `campaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaign" DROP COLUMN "name",
ADD COLUMN     "brandingId" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "emailSubject" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "targetCustomerTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "campaign_slug_key" ON "campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_brandingId_key" ON "campaign"("brandingId");

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_brandingId_fkey" FOREIGN KEY ("brandingId") REFERENCES "branding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
