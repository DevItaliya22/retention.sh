-- AlterEnum
ALTER TYPE "MessageSource" ADD VALUE 'REFERRAL_CLAIM';

-- AlterTable
ALTER TABLE "referral_program" ADD COLUMN     "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
