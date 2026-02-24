import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify Shopify webhook HMAC.
 * Must use the exact raw bytes of the body (Shopify signs the raw body).
 * @param rawBody - Raw request body as Buffer or ArrayBuffer (do not use request.text() – it can alter bytes)
 * @param hmacHeader - X-Shopify-Hmac-Sha256 header value
 * @param secret - Shopify API secret (SHOPIFY_API_SECRET)
 */
export function verifyShopifyWebhook(
  rawBody: Buffer | ArrayBuffer | string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  const trimmed = hmacHeader?.trim();
  const secretTrimmed = secret.trim();
  if (!trimmed || !secretTrimmed) return false;
  const buf =
    rawBody instanceof ArrayBuffer
      ? Buffer.from(rawBody)
      : typeof rawBody === "string"
        ? Buffer.from(rawBody, "utf8")
        : rawBody;
  const computed = createHmac("sha256", secretTrimmed)
    .update(buf)
    .digest("base64");
  try {
    return timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(trimmed, "utf8"),
    );
  } catch {
    return false;
  }
}
