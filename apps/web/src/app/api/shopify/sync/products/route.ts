import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

const SHOPIFY_API_VERSION = "2024-01";
const LIMIT = 100;

type ShopifyProduct = {
  id: number;
  title: string;
  body_html?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  variants?: Array<{
    id: number;
    sku?: string | null;
    title: string;
    price: string;
  }>;
};

type ShopifyProductsResponse = { products: ShopifyProduct[] };

/**
 * POST /api/shopify/sync/products
 * Sync products from the first connected Shopify store into Categories and SKUs.
 * Uses product_type as category name; creates one SKU per variant (or one for the product if no variants).
 */
export const POST = withAdminAuth(async (_request, context) => {
  try {
    const store = await db.shopifyStore.findFirst({
      where: { businessId: context.business.id, isActive: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "No connected Shopify store found. Connect a store first." },
        { status: 400 },
      );
    }

    const businessId = context.business.id;
    const baseUrl = `https://${store.shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;
    let created = 0;
    let updated = 0;
    let pageInfo: string | null = null;

    do {
      const url = new URL(`${baseUrl}/products.json`);
      url.searchParams.set("limit", String(LIMIT));
      if (pageInfo) url.searchParams.set("page_info", pageInfo);

      const res = await fetch(url.toString(), {
        headers: {
          "X-Shopify-Access-Token": store.accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Shopify products fetch failed:", res.status, text);
        return NextResponse.json(
          { error: "Failed to fetch products from Shopify" },
          { status: 502 },
        );
      }

      const data = (await res.json()) as ShopifyProductsResponse;
      const products = data.products ?? [];
      const linkHeader = res.headers.get("link");
      pageInfo = parseNextPageInfo(linkHeader);

      for (const product of products) {
        const categoryName = product.product_type?.trim() || "Uncategorized";
        let category = await db.category.findFirst({
          where: { businessId, name: categoryName },
        });
        if (!category) {
          category = await db.category.create({
            data: {
              businessId,
              name: categoryName,
              sortOrder: 0,
            },
          });
        }

        const variants = product.variants?.length
          ? product.variants
          : [
              {
                id: product.id,
                sku: String(product.id),
                title: product.title,
                price: "0",
              },
            ];

        for (const variant of variants) {
          const skuCode =
            variant.sku?.trim() || `shopify-${product.id}-${variant.id}`;
          const price = parseFloat(variant.price) || 0;
          const name =
            variants.length > 1
              ? `${product.title} - ${variant.title}`
              : product.title;

          const existingSync = await db.shopifyProductSync.findUnique({
            where: {
              shopifyStoreId_shopifyProductId_shopifyVariantId: {
                shopifyStoreId: store.id,
                shopifyProductId: String(product.id),
                shopifyVariantId: String(variant.id),
              },
            },
            include: { sku: true },
          });

          if (existingSync) {
            await db.sku.update({
              where: { id: existingSync.skuId },
              data: {
                name,
                price,
                description: product.body_html?.slice(0, 500) ?? null,
                isActive: true,
              },
            });
            await db.shopifyProductSync.update({
              where: { id: existingSync.id },
              data: { lastSyncedAt: new Date() },
            });
            updated++;
          } else {
            const [existingSku] = await db.sku.findMany({
              where: { businessId, sku: skuCode },
              take: 1,
            });

            let skuId: string;
            if (existingSku) {
              skuId = existingSku.id;
              await db.sku.update({
                where: { id: existingSku.id },
                data: {
                  name,
                  price,
                  description: product.body_html?.slice(0, 500) ?? null,
                },
              });
              updated++;
            } else {
              const sku = await db.sku.create({
                data: {
                  businessId,
                  categoryId: category.id,
                  sku: skuCode,
                  name,
                  price,
                  description: product.body_html?.slice(0, 500) ?? null,
                  isActive: true,
                },
              });
              skuId = sku.id;
              created++;
            }

            await db.shopifyProductSync.upsert({
              where: {
                shopifyStoreId_skuId: { shopifyStoreId: store.id, skuId },
              },
              create: {
                shopifyStoreId: store.id,
                skuId,
                shopifyProductId: String(product.id),
                shopifyVariantId: String(variant.id),
              },
              update: {
                shopifyProductId: String(product.id),
                shopifyVariantId: String(variant.id),
                lastSyncedAt: new Date(),
              },
            });
          }
        }
      }
    } while (pageInfo);

    await db.shopifyStore.update({
      where: { id: store.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      message: `Synced: ${created} new, ${updated} updated.`,
    });
  } catch (error) {
    console.error("Shopify product sync error:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Product sync failed",
      },
      { status: 500 },
    );
  }
});

function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const next = linkHeader.split(",").find((s) => s.includes('rel="next"'));
  if (!next) return null;
  const match = next.match(/page_info=([^&>]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
