import { z } from "zod";

/** Query for install: shop domain (myshop.myshopify.com) */
export const shopifyInstallQuerySchema = z.object({
  shop: z
    .string()
    .min(1, "Shop domain is required")
    .refine(
      (v) =>
        /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(v) ||
        /^[a-z0-9][a-z0-9-]*$/i.test(v),
      "Invalid shop domain (e.g. my-store or my-store.myshopify.com)",
    )
    .transform((v) =>
      v.includes(".myshopify.com") ? v : `${v}.myshopify.com`,
    ),
});

/** Scopes requested from Shopify (comma-separated in URL) */
export const SHOPIFY_SCOPES =
  "read_products,write_products,read_orders,read_customers";

export type ShopifyInstallQuery = z.infer<typeof shopifyInstallQuerySchema>;
