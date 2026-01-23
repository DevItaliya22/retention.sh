/**
 * Product metadata constants for web app
 * Used as default metadata when custom meta tags are not enabled (paid feature)
 * All SEO files (icons, manifest, og.png) are in apps/web/public/ and apps/web/app/
 */

export const PRODUCT_METADATA = {
    name: "Dy",
    title:
      "Dy – Business Loyalty & Marketing Platform for Retail Stores and Brands",
    description:
      "Build customer loyalty programs, run targeted campaigns, and engage customers via WhatsApp. DY helps businesses drive revenue with automated loyalty rewards and smart marketing.",
    shortDescription:
      "Build customer loyalty programs, run targeted campaigns, and engage customers via WhatsApp.",
    image: "/og.png", // Relative path - will be resolved to full URL
    favicon: "/favicon.ico",
    siteName: "Dy",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://dy.com",
    keywords: [
      "business loyalty program",
      "loyalty management",
      "business marketing",
      "WhatsApp marketing",
      "customer campaigns",
      "business CRM",
      "loyalty platform",
      "customer retention",
      "points and rewards",
      "gamification",
      "SMS marketing",
      "email marketing",
      "customer analytics",
      "retail loyalty",
      "Dy",
    ] as string[],
    authors: [{ name: "Dy" }] as Array<{ name: string }>,
    creator: "Dy",
    publisher: "Dy",
    twitter: {
      creator: "@dy",
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
  