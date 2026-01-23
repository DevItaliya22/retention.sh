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
 * Key: route pattern (e.g., "organization/[slug]/settings")
 * Value: metadata configuration
 */
const ROUTE_METADATA_MAP: Record<string, RouteMetadataConfig> = {
  // Root routes
  "/": {
    title: "Dashboard",
    description: "Manage your documents and data rooms",
  },
  "/organizations": {
    title: "Organizations",
    description: "Manage your organizations and workspaces",
  },
  "/welcome": {
    title: "Welcome",
    description: "Create your workspace to get started",
    noIndex: true,
  },

  // Organization routes
  "organization/[slug]": {
    title: (segments) => `Documents - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage documents and links for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/dashboard": {
    title: (segments) => `Dashboard - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Dashboard overview for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/agreements": {
    title: (segments) => `Agreements - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage agreements for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms": {
    title: (segments) => `Data Rooms - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage data rooms for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/deleted": {
    title: (segments) => `Deleted Items - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `View deleted documents and links for ${formatSlug(segments[1])}`,
    noIndex: true,
  },
  "organization/[slug]/personal": {
    title: (segments) => `Personal Links - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage personal document links for ${formatSlug(segments[1])}`,
  },

  // Settings routes
  "organization/[slug]/settings": {
    title: (segments) => `Settings - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Organization settings for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/members": {
    title: (segments) => `Members - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage team members for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/branding": {
    title: (segments) => `Branding - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Customize branding for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/domain": {
    title: (segments) => `Domain - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage custom domain for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/linkpreset": {
    title: (segments) => `Link Presets - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage link presets for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/linkpreset/new": {
    title: (segments) => `New Link Preset - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Create a new link preset for ${formatSlug(segments[1])}`,
    noIndex: true,
  },
  "organization/[slug]/settings/linkpreset/[id]/edit": {
    title: (segments) => `Edit Link Preset - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Edit link preset for ${formatSlug(segments[1])}`,
    noIndex: true,
  },
  "organization/[slug]/settings/tags": {
    title: (segments) => `Tags - ${formatSlug(segments[1])}`,
    description: (segments) => `Manage tags for ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/settings/watermark": {
    title: (segments) => `Watermark - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage watermark configurations for ${formatSlug(segments[1])}`,
  },

  // Document routes
  "organization/[slug]/[id]": {
    title: (segments) => `Document - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `View and manage document in ${formatSlug(segments[1])}`,
  },

  // Dataroom routes
  "organization/[slug]/datarooms/[id]": {
    title: (segments) => `Data Room - ${formatSlug(segments[1])}`,
    description: (segments) => `Manage data room in ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms/[id]/analytics": {
    title: (segments) => `Analytics - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `View analytics for data room in ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms/[id]/branding": {
    title: (segments) => `Branding - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Customize data room branding in ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms/[id]/settings": {
    title: (segments) => `Settings - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Data room settings in ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms/[id]/links&permissions": {
    title: (segments) => `Links & Permissions - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage links and permissions for data room in ${formatSlug(segments[1])}`,
  },
  "organization/[slug]/datarooms/[id]/groups/[groupId]": {
    title: (segments) => `Group - ${formatSlug(segments[1])}`,
    description: (segments) =>
      `Manage viewer group in ${formatSlug(segments[1])}`,
  },

  // View route (handled separately with custom meta tags)
  "view/[linkId]": {
    title: "View Document",
    description: "View secure document",
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
  "organization",
  "organizations",
  "datarooms",
  "dataroom",
  "settings",
  "agreements",
  "dashboard",
  "deleted",
  "personal",
  "tree",
  "view",
  "welcome",
  "auth",
  "api",
  "members",
  "branding",
  "domain",
  "linkpreset",
  "tags",
  "watermark",
  "analytics",
  "groups",
  "links&permissions",
  "new",
  "edit",
  "id",
  "slug",
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

  // Create a set of param values for quick lookup
  const paramValues = new Set<string>();
  Object.values(params).forEach((value) => {
    if (typeof value === "string") {
      paramValues.add(value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => paramValues.add(v));
    }
  });

  // Convert dynamic segments to patterns based on position, context, and params
  const pattern = segments
    .map((segment, index) => {
      // Check if segment is a known param value
      if (paramValues.has(segment)) {
        // Infer param name from context
        const prevSegment = index > 0 ? segments[index - 1] : "";
        const nextSegment =
          index < segments.length - 1 ? segments[index + 1] : "";

        if (prevSegment === "datarooms") return "[id]";
        if (prevSegment === "groups") return "[groupId]";
        if (prevSegment === "linkpreset") return "[id]";
        if (prevSegment === "organization" && index === 1) return "[slug]";
        if (prevSegment === "organization" && index === 2) return "[id]";
        if (prevSegment === "view") return "[linkId]";
        if (nextSegment === "edit") return "[id]";
        if (nextSegment === "analytics") return "[id]";
        if (nextSegment === "settings") return "[id]";
        if (nextSegment === "branding") return "[id]";
        if (nextSegment === "groups") return "[id]";
        if (nextSegment === "links&permissions") return "[id]";

        // Default fallback
        return "[id]";
      }

      // Check if it's a dynamic segment by pattern (UUID, CUID, or long strings)
      const isDynamicById =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment,
        ) ||
        /^[a-z0-9]{25}$/i.test(segment) || // CUID pattern
        (segment.length > 20 && /^[a-z0-9]+$/i.test(segment)); // Long alphanumeric

      if (isDynamicById) {
        // Infer param name from context
        const prevSegment = index > 0 ? segments[index - 1] : "";
        const nextSegment =
          index < segments.length - 1 ? segments[index + 1] : "";

        if (prevSegment === "datarooms") return "[id]";
        if (prevSegment === "groups") return "[groupId]";
        if (prevSegment === "linkpreset") return "[id]";
        if (prevSegment === "organization" && index === 2) return "[id]";
        if (prevSegment === "view") return "[linkId]";
        if (nextSegment === "edit") return "[id]";
        if (nextSegment === "analytics") return "[id]";
        if (nextSegment === "settings") return "[id]";
        if (nextSegment === "branding") return "[id]";
        if (nextSegment === "groups") return "[id]";
        if (nextSegment === "links&permissions") return "[id]";

        // Default fallback
        return "[id]";
      }

      // Check if segment is likely a slug (after organization, not in static list, not an ID)
      if (
        index === 1 &&
        segments[0] === "organization" &&
        !STATIC_ROUTE_SEGMENTS.has(segment) &&
        !isDynamicById
      ) {
        return "[slug]";
      }

      // Check if segment is likely an ID (after organization/[slug], not in static list)
      if (
        index === 2 &&
        segments[0] === "organization" &&
        !STATIC_ROUTE_SEGMENTS.has(segment) &&
        !isDynamicById
      ) {
        return "[id]";
      }

      // Return segment as-is if it's a static route segment
      return segment;
    })
    .join("/");

  return pattern;
}

/**
 * Generates metadata for a route based on pathname and params
 * Works without database calls - uses route structure only
 */
export function generateRouteMetadata(
  pathname: string,
  params: Record<string, string | string[] | undefined> = {},
): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sendpaper.io";
  const fullUrl = `${baseUrl}${pathname}`;

  // Get route pattern (now uses params for better detection)
  const routePattern = getRoutePattern(pathname, params);

  // Find matching metadata config
  const config = ROUTE_METADATA_MAP[routePattern];

  if (!config) {
    // Fallback: generate from path segments
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "Dashboard";
    const title = formatSlug(lastSegment);
    const description = `Manage ${title.toLowerCase()} in sendpaper`;

    return constructMetadata({
      title,
      description,
      url: fullUrl,
    });
  }

  // Extract segments for dynamic functions
  const segments = pathname.split("/").filter(Boolean);

  // Generate title and description
  const title =
    typeof config.title === "function" ? config.title(segments) : config.title;
  const description =
    typeof config.description === "function"
      ? config.description(segments)
      : config.description;

  return constructMetadata({
    title,
    description,
    url: fullUrl,
    noIndex: config.noIndex,
  });
}
