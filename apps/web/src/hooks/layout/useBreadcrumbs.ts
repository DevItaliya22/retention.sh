"use client";

import {
  type BreadcrumbConfig,
  parseBreadcrumbPath,
} from "@/lib/utils/breadcrumb";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useBreadcrumbs(): BreadcrumbConfig {
  const pathname = usePathname();

  const { filter, slug } = useMemo(
    () => parseBreadcrumbPath(pathname),
    [pathname],
  );

  return useMemo((): BreadcrumbConfig => {
    // Hide breadcrumbs on these routes
    if (
      pathname === "/" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/welcome") ||
      pathname === "/organizations"
    ) {
      return {
        items: [],
        shouldShow: false,
      };
    }

    const items: BreadcrumbConfig["items"] = [];

    // Handle organization routes
    if (pathname.startsWith("/organization/") && slug) {
      const segments = pathname.split("/").filter(Boolean);

      // Handle organization settings pages
      if (segments[2] === "settings") {
        items.push({
          label: "Settings",
          href: `/organization/${slug}/settings`,
        });

        if (segments.length === 3) {
          items.push({
            label: "General",
            href: `/organization/${slug}/settings`,
            isActive: true,
          });
        } else if (segments.length > 3) {
          const settingsPage = segments[3];
          items.push({
            label: settingsPage || "Settings",
            href: `/organization/${slug}/settings/${settingsPage}`,
            isActive: true,
          });
        }
      }
      // Handle organization filter/content pages
      else if (filter) {
        const filterLabels: Record<string, string> = {
          organization: "Organization",
        };

        items.push({
          label: filterLabels[filter] || filter,
          href: `/organization/${slug}${filter !== "organization" ? `/${filter}` : ""}`,
          isActive: segments.length === 2,
        });
      }
      // Default organization route
      else {
        items.push({
          label: "Organization",
          href: `/organization/${slug}`,
          isActive: true,
        });
      }
    }

    // Handle other routes
    if (pathname === "/inbox") {
      items.push({ label: "Inbox", isActive: true });
    }

    if (pathname === "/members") {
      items.push({ label: "Members", isActive: true });
    }

    if (pathname === "/org-settings") {
      items.push({ label: "Organization Settings", isActive: true });
    }

    return {
      items,
      shouldShow: items.length > 0,
    };
  }, [pathname, slug, filter]);
}
