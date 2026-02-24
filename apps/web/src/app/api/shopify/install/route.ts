import { withAdminAuth } from "@/lib/auth/middleware";
import { shopifyInstallQuerySchema } from "@/lib/schemas/shopify";
import { createShopifyState } from "@/lib/shopify/oauth-state";
import { validateSchema } from "@/lib/utils/error-handler";
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_SCOPES =
  "read_products,write_products,read_orders,read_customers";

/**
 * GET /api/shopify/install?shop=myshop.myshopify.com
 * Redirects the admin to Shopify OAuth. Requires admin session and business.
 */
export const GET = withAdminAuth(async (request: NextRequest, context) => {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !secret) {
    return NextResponse.json(
      { error: "Shopify integration is not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  const validation = validateSchema(shopifyInstallQuerySchema, query);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { shop } = validation.data;

  const baseUrl = process.env.NEXT_PUBLIC_URL!;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/shopify/callback`;

  const state = createShopifyState(context.business.id);
  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", SHOPIFY_SCOPES);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
});
