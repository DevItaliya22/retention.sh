import { verifyShopifyState } from "@/lib/shopify/oauth-state";
import { registerOrderWebhooks } from "@/lib/shopify/register-webhooks";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/shopify/callback?code=...&shop=...&state=...
 * Shopify OAuth callback. Exchanges code for access_token and saves ShopifyStore.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !secret) {
    return NextResponse.redirect(
      new URL("/settings/shopify?error=config", request.url).toString(),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  const baseUrl =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const settingsUrl = new URL("/settings/shopify", baseUrl);

  if (!code || !shop || !state) {
    settingsUrl.searchParams.set("error", "missing_params");
    return NextResponse.redirect(settingsUrl.toString());
  }

  const payload = verifyShopifyState(state);
  if (!payload) {
    settingsUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(settingsUrl.toString());
  }

  const { businessId } = payload;

  // Normalize shop domain
  const shopDomain = shop.includes(".myshopify.com")
    ? shop
    : `${shop}.myshopify.com`;

  try {
    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: secret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Shopify token exchange failed:", tokenRes.status, errText);
      settingsUrl.searchParams.set("error", "token_exchange");
      return NextResponse.redirect(settingsUrl.toString());
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      scope?: string;
    };

    await db.shopifyStore.upsert({
      where: {
        businessId_shopDomain: { businessId, shopDomain },
      },
      create: {
        businessId,
        shopDomain,
        shopName: shopDomain.replace(".myshopify.com", ""),
        accessToken: tokenData.access_token,
        scope: tokenData.scope ?? null,
        isActive: true,
      },
      update: {
        accessToken: tokenData.access_token,
        scope: tokenData.scope ?? null,
        isActive: true,
      },
    });

    // Register webhooks via API so they're tied to our app and signed with our Client secret.
    // Manually created webhooks in Shopify Admin are tied to the shop and can cause HMAC 401.
    const { ok, errors } = await registerOrderWebhooks({
      shopDomain,
      accessToken: tokenData.access_token,
      baseUrl,
    });
    if (!ok && errors.length > 0) {
      console.warn("[Shopify callback] Webhook registration issues:", errors);
    }

    settingsUrl.searchParams.set("connected", "1");
    return NextResponse.redirect(settingsUrl.toString());
  } catch (error) {
    console.error("Shopify callback error:", error);
    settingsUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(settingsUrl.toString());
  }
}
