import { createHmac, timingSafeEqual } from "node:crypto";

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface ShopifyStatePayload {
  businessId: string;
  exp: number;
}

export function createShopifyState(businessId: string): string {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    throw new Error("SHOPIFY_API_SECRET is not set");
  }
  const payload: ShopifyStatePayload = {
    businessId,
    exp: Date.now() + STATE_EXPIRY_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export function verifyShopifyState(state: string): ShopifyStatePayload | null {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return null;
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = createHmac("sha256", secret)
    .update(encoded)
    .digest("hex");
  // Constant-time comparison to avoid timing attacks
  if (sig.length !== expectedSig.length) return null;
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))
    )
      return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8"),
    ) as ShopifyStatePayload;
    if (payload.exp < Date.now() || !payload.businessId) return null;
    return payload;
  } catch {
    return null;
  }
}
