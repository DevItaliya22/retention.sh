/**
 * Product metadata constants for web app
 * Used as default metadata when custom meta tags are not enabled (paid feature)
 * All SEO files (icons, manifest, og.png) are in apps/web/public/ and apps/web/app/
 */

export const PRODUCT_METADATA = {
    name: "sendpaper",
    title:
      "Sendpaper – Secure Document Sharing with Data Rooms for Startups, SMBs, and Enterprises",
    description:
      "Share documents securely with real-time analytics and data rooms. Significantly cheaper than DocSend—perfect for fundraising, M&A, and sales.",
    shortDescription:
      "Share documents securely with real-time analytics. Significantly cheaper than DocSend.",
    image: "/og.png", // Relative path - will be resolved to full URL
    favicon: "/favicon.ico",
    siteName: "sendpaper",
    url: "https://www.sendpaper.io",
    keywords: [
      "document sharing",
      "data room",
      "virtual data room",
      "DocSend & Papermark alternative",
      "secure file sharing",
      "fundraising data room",
      "M&A data room",
      "pitch deck sharing",
      "investor data room",
      "document analytics",
      "startup fundraising",
      "sendpaper",
      "secure document sharing",
    ] as string[],
    authors: [{ name: "sendpaper" }] as Array<{ name: string }>,
    creator: "sendpaper",
    publisher: "sendpaper",
    twitter: {
      creator: "@arv153",
    },
    locale: "en_US",
  } as const;
  
  /**
   * Gets the full URL for product metadata image
   * Uses NEXT_PUBLIC_APP_URL if available, otherwise falls back to product URL
   */
  export function getProductImageUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || PRODUCT_METADATA.url;
    return `${baseUrl}${PRODUCT_METADATA.image}`;
  }
  
  /**
   * Gets the full URL for product favicon
   * Uses NEXT_PUBLIC_APP_URL if available, otherwise falls back to product URL
   */
  export function getProductFaviconUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || PRODUCT_METADATA.url;
    return `${baseUrl}${PRODUCT_METADATA.favicon}`;
  }
  