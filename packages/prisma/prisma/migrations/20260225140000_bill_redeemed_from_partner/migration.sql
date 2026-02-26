-- AlterTable: which partner's balance was used on this bill (one partner per bill; for analytics and to block a second partner).
ALTER TABLE "bill" ADD COLUMN IF NOT EXISTS "redeemedFromPartnerBusinessId" TEXT;
