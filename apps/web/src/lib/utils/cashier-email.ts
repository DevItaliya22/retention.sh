import {
  DEFAULT_EMAIL_DOMAIN_SUFFIX,
  EMAIL_DOMAIN_SUFFIXES,
} from "@/lib/constants/email-domains";

/**
 * Build a cashier email from parts: localPart@slug.suffix
 */
export function buildCashierEmail(
  localPart: string,
  slug: string,
  suffix: string,
): string {
  return `${localPart.trim().toLowerCase()}@${slug}.${suffix}`;
}

/**
 * Parse a cashier email into its parts, given the business slug.
 * Returns { localPart, suffix }.
 */
export function parseCashierEmail(
  email: string,
  slug: string,
): { localPart: string; suffix: string } {
  if (!email || !slug) {
    return { localPart: "", suffix: DEFAULT_EMAIL_DOMAIN_SUFFIX };
  }

  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    return { localPart: email, suffix: DEFAULT_EMAIL_DOMAIN_SUFFIX };
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // Expected domain format: slug.suffix
  const expectedPrefix = `${slug}.`;
  if (domain.startsWith(expectedPrefix)) {
    const suffix = domain.substring(expectedPrefix.length);
    const validSuffix = EMAIL_DOMAIN_SUFFIXES.find((s) => s.value === suffix);
    if (validSuffix) {
      return { localPart, suffix };
    }
  }

  // Fallback: just use the local part and default suffix
  return { localPart, suffix: DEFAULT_EMAIL_DOMAIN_SUFFIX };
}
