export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  className?: string;
}

export interface BreadcrumbConfig {
  items: BreadcrumbItem[];
  shouldShow: boolean;
}

export interface ParsedBreadcrumbPath {
  slug: string | null;
  filter: string | null;
}

export function parseBreadcrumbPath(
  pathname: string | null,
): ParsedBreadcrumbPath {
  if (!pathname) {
    return {
      slug: null,
      filter: null,
    };
  }

  const segments = pathname.split("/").filter(Boolean);

  // Parse organization routes: /organization/[slug]/...
  if (segments[0] === "organization" && segments.length >= 2) {
    const slug = segments[1] || null;

    // Check for filter paths: /organization/[slug]/[filter]
    if (segments.length === 3) {
      const filter = segments[2];
      if (filter && filter !== "settings") {
        return {
          slug,
          filter,
        };
      }
    }

    // Default organization route
    return {
      slug,
      filter: "organization",
    };
  }

  // Default: no organization context
  return {
    slug: null,
    filter: null,
  };
}
