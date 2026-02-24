-- CreateTable
CREATE TABLE "shopify_store" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopName" TEXT,
    "accessToken" TEXT NOT NULL,
    "scope" TEXT,
    "webhookSecret" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_product_sync" (
    "id" TEXT NOT NULL,
    "shopifyStoreId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_product_sync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopify_store_businessId_idx" ON "shopify_store"("businessId");

-- CreateIndex
CREATE INDEX "shopify_store_shopDomain_idx" ON "shopify_store"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_store_businessId_shopDomain_key" ON "shopify_store"("businessId", "shopDomain");

-- CreateIndex
CREATE INDEX "shopify_product_sync_shopifyStoreId_idx" ON "shopify_product_sync"("shopifyStoreId");

-- CreateIndex
CREATE INDEX "shopify_product_sync_skuId_idx" ON "shopify_product_sync"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_sync_shopifyStoreId_skuId_key" ON "shopify_product_sync"("shopifyStoreId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_product_sync_shopifyStoreId_shopifyProductId_shopif_key" ON "shopify_product_sync"("shopifyStoreId", "shopifyProductId", "shopifyVariantId");

-- AddForeignKey
ALTER TABLE "shopify_store" ADD CONSTRAINT "shopify_store_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_sync" ADD CONSTRAINT "shopify_product_sync_shopifyStoreId_fkey" FOREIGN KEY ("shopifyStoreId") REFERENCES "shopify_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopify_product_sync" ADD CONSTRAINT "shopify_product_sync_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;
