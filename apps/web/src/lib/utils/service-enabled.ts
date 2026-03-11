import { z } from "zod";

/**
 * Service keys - add new ones here when adding services.
 * Used for isServiceEnabled JSON on Business model.
 */
export const SERVICE_KEYS = ["referral", "loyalty", "feedback"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

/**
 * Default boolean for each service when a new business is created.
 * Edit defaults here; onboarding will use this full object.
 */
export const DEFAULT_SERVICE_VALUES: Record<ServiceKey, boolean> = {
  referral: true,
  loyalty: true,
  feedback: true,
};

/**
 * Full isServiceEnabled object for new businesses.
 * All keys present with default values.
 */
export const DEFAULT_SERVICES_ON_CREATION: Record<ServiceKey, boolean> = {
  ...DEFAULT_SERVICE_VALUES,
};

/**
 * Shape of isServiceEnabled JSON in DB.
 * Keys only exist when explicitly set; missing key = disabled by default.
 */
export type IsServiceEnabled = Partial<Record<ServiceKey, boolean>>;

/**
 * Schema for partial service updates (API input).
 * Values are optional so { referral: true } without loyalty is valid.
 */
export const isServiceEnabledSchema = z
  .record(z.enum(SERVICE_KEYS), z.boolean().optional())
  .optional();

export type IsServiceEnabledInput = z.infer<typeof isServiceEnabledSchema>;

/**
 * Get whether a service is enabled.
 * Default: false if key is missing or obj is null/undefined.
 */
export function isServiceEnabled(
  obj: IsServiceEnabled | null | undefined,
  key: ServiceKey,
): boolean {
  if (!obj || typeof obj !== "object") return false;
  return obj[key] === true;
}

/**
 * Merge a service enable/disable into the object for DB.
 * Returns a new object ready to store; does not mutate.
 */
export function setServiceEnabled(
  current: IsServiceEnabled | null | undefined,
  key: ServiceKey,
  enabled: boolean,
): IsServiceEnabled {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...current }
      : {};
  return { ...base, [key]: enabled };
}

/**
 * Merge partial service updates into current object.
 * Use for API updates - only overwrites keys present in updates.
 */
export function mergeServiceEnabled(
  current: IsServiceEnabled | null | undefined,
  updates: Partial<Record<ServiceKey, boolean>>,
): IsServiceEnabled {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...current }
      : {};
  for (const k of SERVICE_KEYS) {
    const val = updates[k];
    if (typeof val === "boolean") {
      base[k] = val;
    }
  }
  // Strip undefined so DB gets clean JSON
  const result: IsServiceEnabled = {};
  for (const k of SERVICE_KEYS) {
    const v = base[k];
    if (typeof v === "boolean") result[k] = v;
  }
  return result;
}
