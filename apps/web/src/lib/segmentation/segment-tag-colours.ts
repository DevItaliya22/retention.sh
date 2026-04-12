import type { CSSProperties } from "react";

/** Twenty fixed segment colours (shared by settings, RFM, and APIs). */
export const SEGMENT_TAG_PALETTE = [
  "#2563EB",
  "#16A34A",
  "#D97706",
  "#DC2626",
  "#EA580C",
  "#DB2777",
  "#0D9488",
  "#059669",
  "#CA8A04",
  "#64748B",
  "#7C3AED",
  "#9333EA",
  "#4F46E5",
  "#0891B2",
  "#65A30D",
  "#C026D3",
  "#E11D48",
  "#0F766E",
  "#B45309",
  "#1E293B",
] as const;

export type SegmentTagHex = (typeof SEGMENT_TAG_PALETTE)[number];

/** Default palette index per built-in system slug (matches former RFM Tailwind mapping). */
export const DEFAULT_SYSTEM_SLUG_TO_PALETTE_INDEX: Record<string, number> = {
  vip: 0,
  loyal: 1,
  "cant-loose": 2,
  lost: 3,
  "about-to-sleep": 4,
  "at-risk": 5,
  "potential-loyalist": 6,
  promising: 7,
  "needs-attention": 8,
  other: 9,
};

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

export function normalizeTagColourHex(input: string): string | null {
  const m = input.trim().match(HEX_RE);
  if (!m) return null;
  return `#${m[1].toUpperCase()}`;
}

export function isAllowedTagColourHex(hex: string): boolean {
  const n = normalizeTagColourHex(hex);
  return n != null && (SEGMENT_TAG_PALETTE as readonly string[]).includes(n);
}

export function hashSlugToPaletteIndex(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % SEGMENT_TAG_PALETTE.length;
}

/** Fallback when `tagColour` is not set in DB (null / legacy rows). */
export function getDefaultTagHexForSlug(slug: string): SegmentTagHex {
  const key = slug.trim().toLowerCase();
  const idx = DEFAULT_SYSTEM_SLUG_TO_PALETTE_INDEX[key];
  if (idx !== undefined) return SEGMENT_TAG_PALETTE[idx];
  return SEGMENT_TAG_PALETTE[hashSlugToPaletteIndex(key)]!;
}

/**
 * Resolved display colour: stored override, else slug-based default.
 */
export function getSegmentTagHex(
  tagColour: string | null | undefined,
  slug: string,
): SegmentTagHex {
  const normalized = tagColour ? normalizeTagColourHex(tagColour) : null;
  if (
    normalized &&
    (SEGMENT_TAG_PALETTE as readonly string[]).includes(normalized)
  ) {
    return normalized as SegmentTagHex;
  }
  return getDefaultTagHexForSlug(slug);
}

/** `null` in DB means “use default for slug”; omit saving when still default. */
export function tagColourForPersist(
  selectedHex: string,
  slug: string,
): string | null {
  const sel = normalizeTagColourHex(selectedHex);
  if (!sel) return null;
  const def = getDefaultTagHexForSlug(slug);
  return sel === def ? null : sel;
}

export function segmentCardSurfaceStyle(hex: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${hex} 22%, var(--card))`,
    borderColor: `color-mix(in srgb, ${hex} 40%, var(--border))`,
  };
}

export function segmentIconSurfaceStyle(hex: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${hex} 28%, transparent)`,
    color: hex,
    borderColor: `color-mix(in srgb, ${hex} 45%, var(--border))`,
  };
}
