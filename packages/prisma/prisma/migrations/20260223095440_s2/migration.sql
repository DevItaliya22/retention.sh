-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'SHOPIFY_ORDER';

-- AlterTable
ALTER TABLE "shopify_store" ADD COLUMN     "returnWindowDays" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "shopifyOrderId" TEXT;

-- CreateTable
CREATE TABLE "shopify_order" (
    "id" TEXT NOT NULL,
    "shopifyStoreId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "fulfillmentStatus" TEXT,
    "financialStatus" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "returnWindowEndsAt" TIMESTAMP(3),
    "loyaltyGrantedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopify_order_businessId_idx" ON "shopify_order"("businessId");

-- CreateIndex
CREATE INDEX "shopify_order_customerId_idx" ON "shopify_order"("customerId");

-- CreateIndex
CREATE INDEX "shopify_order_returnWindowEndsAt_idx" ON "shopify_order"("returnWindowEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_order_shopifyStoreId_shopifyOrderId_key" ON "shopify_order"("shopifyStoreId", "shopifyOrderId");

-- CreateIndex
CREATE INDEX "transaction_shopifyOrderId_idx" ON "transaction"("shopifyOrderId");

-- AddForeignKey
ALTER TABLE "shopify_order" ADD CONSTRAINT "shopify_order_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "shopify_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "shopify_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
