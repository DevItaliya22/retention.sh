import type { Metadata } from "next";

import { constructMetadata } from "@/lib/utils/metadata";

/**
 * Route metadata configuration
 * Maps route patterns to metadata templates
 * Uses route segments to generate dynamic titles and descriptions
 */
interface RouteMetadataConfig {
  title: string | ((segments: string[]) => string);
  description: string | ((segments: string[]) => string);
  noIndex?: boolean;
}

/**
 * Route metadata mappings
 * Key: route pattern (e.g., "settings/cashier")
 * Value: metadata configuration
 */
const ROUTE_METADATA_MAP: Record<string, RouteMetadataConfig> = {
  // Root routes
  "/": {
    title: "Dashboard",
    description:
      "Manage your business loyalty programs and customer engagement",
  },
  "/login": {
    title: "Sign In",
    description:
      "Sign in to your Dy account to manage your loyalty programs and campaigns",
    noIndex: true,
  },
  "/register": {
    title: "Sign Up",
    description:
      "Create your Dy account to start building customer loyalty programs",
    noIndex: true,
  },
  "/welcome": {
    title: "Welcome",
    description:
      "Set up your business to get started with loyalty programs and marketing",
    noIndex: true,
  },
  "/inbox": {
    title: "Inbox",
    description: "View and manage your customer messages and notifications",
  },
  "/bills": {
    title: "Bills",
    description: "View and manage all bills for your business",
  },
  "/bills/[id]": {
    title: "Bill details",
    description: "View bill details and customer information",
  },
  "/customers": {
    title: "Customers",
    description: "View and manage all customers for your business",
  },
  "/settings": {
    title: "Settings",
    description:
      "Manage your business settings, preferences, and configurations",
  },
  "/settings/cashier": {
    title: "Cashier Settings",
    description: "Manage cashier accounts and permissions for your business",
  },
  "/cashier/[businessSlug]/[cashierSlug]": {
    title: (segments) => `Cashier Login - ${formatSlug(segments[1])}`,
    description: "Sign in to your cashier account",
    noIndex: true,
  },
  "/cashier/[businessSlug]/[cashierSlug]/home": {
    title: (segments) => `Cashier Dashboard - ${formatSlug(segments[1])}`,
    description: "Cashier dashboard",
    noIndex: true,
  },
};

/**
 * Formats a slug for display (capitalizes and replaces hyphens)
 */
function formatSlug(slug: string | undefined): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Reserved route segments that are never dynamic params
 */
const STATIC_ROUTE_SEGMENTS = new Set([
  "settings",
  "welcome",
  "inbox",
  "login",
  "register",
  "auth",
  "api",
  "cashier",
  "business",
  "admin-auth",
]);

/**
 * Gets route pattern from pathname and params
 * Converts actual path to pattern format using route structure and params
 */
function getRoutePattern(
  pathname: string,
  params: Record<string, string | string[] | undefined> = {},
): string {
  // Remove leading slash and split
  const segments = pathname.split("/").filter(Boolean);

  // Filter out route groups (parentheses) from segments
  const filteredSegments = segments.filter(
    (seg) => !seg.startsWith("(") && !seg.endsWith(")"),
  );

  // Handle bills detail
  if (filteredSegments[0] === "bills" && filteredSegments.length === 2) {
    return "/bills/[id]";
  }

  // Handle cashier portal routes
  if (filteredSegments[0] === "cashier" && filteredSegments.length >= 3) {
    if (filteredSegments.length === 3) {
      return "/cashier/[businessSlug]/[cashierSlug]";
    }
    if (filteredSegments.length === 4 && filteredSegments[3] === "home") {
      return "/cashier/[businessSlug]/[cashierSlug]/home";
    }
  }

  // Simple pattern matching - return path as-is for static routes
  const pattern = filteredSegments.join("/");

  // Return with leading slash for consistency
  return pattern ? `/${pattern}` : "/";
}

/**
 * Generates metadata for a route based on pathname and params
 * Works without database calls - uses route structure only
 */
export function generateRouteMetadata(
  pathname: string,
  params: Record<string, string | string[] | undefined> = {},
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dy.com";
  const fullUrl = `${baseUrl}${pathname}`;

  // Get route pattern (now uses params for better detection)
  const routePattern = getRoutePattern(pathname, params);

  // Find matching metadata config
  const config = ROUTE_METADATA_MAP[routePattern];

  if (!config) {
    // Fallback: generate from path segments
    const segments = pathname.split("/").filter(Boolean);
    const filteredSegments = segments.filter(
      (seg) => !seg.startsWith("(") && !seg.endsWith(")"),
    );
    const lastSegment =
      filteredSegments[filteredSegments.length - 1] || "Dashboard";
    const title = formatSlug(lastSegment);
    const description = `Manage ${title.toLowerCase()} in Dy`;

    return constructMetadata({
      title,
      description,
      url: fullUrl,
    });
  }

  // Extract segments for dynamic functions
  const segments = pathname.split("/").filter(Boolean);
  const filteredSegments = segments.filter(
    (seg) => !seg.startsWith("(") && !seg.endsWith(")"),
  );

  // Generate title and description
  const title =
    typeof config.title === "function"
      ? config.title(filteredSegments)
      : config.title;
  const description =
    typeof config.description === "function"
      ? config.description(filteredSegments)
      : config.description;

  return constructMetadata({
    title,
    description,
    url: fullUrl,
    noIndex: config.noIndex,
  });
}
