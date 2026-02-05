import type { Metadata } from "next";

import {
  PRODUCT_METADATA,
  getProductImageUrl,
} from "@/lib/constants/product-metadata";

/**
 * Ensures a URL is absolute (has protocol)
 * If relative, prepends baseUrl
 * Returns null if input is null/undefined
 */
export function ensureAbsoluteUrl(
  url: string | null | undefined,
  baseUrl: string,
): string | null {
  if (!url) return null;

  // Already absolute (starts with http:// or https://)
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Relative URL - make it absolute
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Constructs metadata for any page in the web app
 * Includes all SEO features: keywords, authors, verification, robots, icons, manifest
 * Uses web app's own SEO files and sendpaper branding
 */
export function constructMetadata({
  title,
  fullTitle,
  description = PRODUCT_METADATA.description,
  image = getProductImageUrl(),
  video,
  icons,
  url,
  canonicalUrl,
  noIndex = false,
  // manifest = "/site.webmanifest",
  keywords,
  authors,
  verification,
}: {
  title?: string;
  fullTitle?: string;
  description?: string;
  image?: string | null;
  video?: string | null;
  icons?: Metadata["icons"];
  url?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  manifest?: string | URL | null;
  keywords?: string[];
  authors?: Array<{ name: string }>;
  verification?: {
    google?: string;
    yandex?: string;
    bing?: string;
  };
} = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || PRODUCT_METADATA.url;

  // Only process if image is provided (not null/undefined)
  const finalImage = image
    ? ensureAbsoluteUrl(image, baseUrl) || getProductImageUrl()
    : null;

  // Default icons (comprehensive set like landing page with sendpaper branding)
  const defaultIcons: Metadata["icons"] = {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  };

  // Format OpenGraph image with dimensions if available
  const ogImage = finalImage
    ? typeof finalImage === "string"
      ? {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: title || PRODUCT_METADATA.title,
        }
      : finalImage
    : undefined;

  return {
    title:
      fullTitle ||
      (title
        ? `${title} | ${PRODUCT_METADATA.siteName}`
        : PRODUCT_METADATA.title),
    description,
    keywords: keywords || PRODUCT_METADATA.keywords,
    authors: authors || PRODUCT_METADATA.authors,
    creator: PRODUCT_METADATA.creator,
    publisher: PRODUCT_METADATA.publisher,
    openGraph: {
      title: title || PRODUCT_METADATA.title,
      description,
      siteName: PRODUCT_METADATA.siteName,
      type: "website",
      locale: PRODUCT_METADATA.locale,
      ...(ogImage && {
        images: ogImage,
      }),
      ...(url && { url }),
      ...(video && {
        videos: video,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: title || PRODUCT_METADATA.title,
      description,
      ...(finalImage && {
        images: [finalImage],
      }),
      ...(video && {
        player: video,
      }),
      creator: PRODUCT_METADATA.twitter.creator,
    },
    icons: icons || defaultIcons,
    metadataBase: new URL(baseUrl),
    ...((url || canonicalUrl) && {
      alternates: {
        canonical: url || canonicalUrl,
      },
    }),
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {
          robots: {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-video-preview": -1,
              "max-image-preview": "large",
              "max-snippet": -1,
            },
          },
        }),
    // ...(manifest && {
    //   manifest,
    // }),
    ...(verification && {
      verification: {
        ...(verification.google && { google: verification.google }),
        ...(verification.yandex && { yandex: verification.yandex }),
        ...(verification.bing && { bing: verification.bing }),
      },
    }),
  };
}
