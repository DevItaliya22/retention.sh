/**
 * Normalized shape for a wallet free item (unclaimed).
 * Wallet.freeItems can be JSON array of these, or legacy/simple string in some cases.
 */
export interface FreeItemEntry {
  id: string;
  skuId: string | null;
  skuName: string;
  /** CAMPAIGN | REFERRAL | LOYALTY | ADMIN | OTHER */
  source: string;
  sourceId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

/**
 * Parse wallet.freeItems (JSON): can be array of objects or, in legacy cases, a simple string.
 * Returns only valid object entries; invalid or string-only values are skipped or normalized.
 */
export function parseFreeItems(raw: unknown): FreeItemEntry[] {
  if (raw == null) return [];
  let arr: unknown[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      arr = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Legacy: treat whole string as a single item label
      return [
        {
          id: crypto.randomUUID(),
          skuId: null,
          skuName: raw,
          source: "OTHER",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [];
  }
  const result: FreeItemEntry[] = [];
  for (const item of arr) {
    if (item != null && typeof item === "object" && "id" in item) {
      const o = item as Record<string, unknown>;
      result.push({
        id: String(o.id ?? crypto.randomUUID()),
        skuId: o.skuId != null ? String(o.skuId) : null,
        skuName: String(o.skuName ?? "Free item"),
        source: String(o.source ?? "OTHER"),
        sourceId: o.sourceId != null ? String(o.sourceId) : null,
        expiresAt: o.expiresAt != null ? String(o.expiresAt) : null,
        createdAt:
          typeof o.createdAt === "string"
            ? o.createdAt
            : new Date().toISOString(),
      });
    } else if (typeof item === "string" && item.trim()) {
      result.push({
        id: crypto.randomUUID(),
        skuId: null,
        skuName: item.trim(),
        source: "OTHER",
        createdAt: new Date().toISOString(),
      });
    }
  }
  return result;
}
