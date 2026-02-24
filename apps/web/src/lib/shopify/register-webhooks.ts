/**
 * Register order-related webhooks with Shopify via Admin API.
 * Webhooks created this way are tied to our app and signed with our Client secret (HMAC).
 * Manually created webhooks in Shopify Admin are tied to the shop and may use a different secret.
 */

const SHOPIFY_API_VERSION = "2024-01";

const ORDER_WEBHOOK_TOPICS = [
  "orders/create",
  "orders/updated",
  "orders/cancelled",
  "orders/delete",
  "refunds/create",
] as const;

export type RegisterWebhooksParams = {
  shopDomain: string;
  accessToken: string;
  /** Base URL of the app (e.g. https://xxxx.ngrok-free.app or production URL) */
  baseUrl: string;
};

/**
 * Registers order webhooks for the given shop. Uses the app's access token so
 * Shopify signs payloads with our Client secret (SHOPIFY_API_SECRET).
 */
export async function registerOrderWebhooks({
  shopDomain,
  accessToken,
  baseUrl,
}: RegisterWebhooksParams): Promise<{ ok: boolean; errors: string[] }> {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/shopify/webhooks/orders`;
  const errors: string[] = [];

  for (const topic of ORDER_WEBHOOK_TOPICS) {
    try {
      const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: endpoint,
            format: "json",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        // 422 often means webhook for this topic+address already exists (e.g. reconnecting)
        if (res.status === 422 && /already|duplicate|taken/i.test(text)) {
          if (process.env.NODE_ENV !== "production") {
            console.log("[Shopify] Webhook already exists:", topic);
          }
        } else {
          errors.push(`${topic}: ${res.status} ${text}`);
        }
        continue;
      }
      // 201 = created
      const data = (await res.json()) as { webhook?: { id?: number } };
      if (process.env.NODE_ENV !== "production") {
        console.log("[Shopify] Webhook registered:", topic, data.webhook?.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${topic}: ${msg}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
