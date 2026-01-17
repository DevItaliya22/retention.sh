"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export type SidebarType = "organization" | "hidden";

export interface RouteConfig {
  sidebarType: SidebarType;
  headerTitle: string | null;
  shouldShowOrgSelector: boolean;
  shouldShowSidebar: boolean;
  pathname: string;
}

export function useRouteConfig(): RouteConfig {
  const pathname = usePathname();

  return useMemo((): RouteConfig => {
    // Organization routes with sidebar
    if (
      pathname.startsWith("/organization/") ||
      pathname === "/inbox" ||
      pathname === "/members" ||
      pathname === "/org-settings"
    ) {
      return {
        sidebarType: "organization",
        headerTitle: null,
        shouldShowOrgSelector: true,
        shouldShowSidebar: true,
        pathname,
      };
    }

    // Specific dashboard routes with no sidebar
    if (pathname === "/organizations") {
      return {
        sidebarType: "hidden",
        headerTitle: "Organizations",
        shouldShowOrgSelector: false,
        shouldShowSidebar: false,
        pathname,
      };
    }

    if (pathname === "/new") {
      return {
        sidebarType: "hidden",
        headerTitle: "New organization",
        shouldShowOrgSelector: false,
        shouldShowSidebar: false,
        pathname,
      };
    }

    // Auth and welcome routes with no sidebar
    if (
      pathname.startsWith("/auth") ||
      pathname.startsWith("/welcome") ||
      pathname === "/"
    ) {
      return {
        sidebarType: "hidden",
        headerTitle: null,
        shouldShowOrgSelector: false,
        shouldShowSidebar: false,
        pathname,
      };
    }

    // Default fallback for any other routes
    return {
      sidebarType: "hidden",
      headerTitle: "Dashboard",
      shouldShowOrgSelector: false,
      shouldShowSidebar: false,
      pathname,
    };
  }, [pathname]);
}
