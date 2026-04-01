"use client";

import { CustomerLogoutButton } from "@/components/customer-portal/CustomerLogoutButton";
import { Button } from "@reelo/ui/components";
import { LogOut } from "lucide-react";
import type { LoyaltyBranding } from "./types";

interface LoyaltyNavbarProps {
  businessName: string;
  businessSlug: string;
  branding?: LoyaltyBranding | null;
  /** When true, renders a non-functional logout button (for admin preview) */
  previewMode?: boolean;
}

export function LoyaltyNavbar({
  businessName,
  businessSlug,
  branding,
  previewMode,
}: LoyaltyNavbarProps) {
  const hasTheme = !!branding?.themeColor;

  const logoutButton = previewMode ? (
    <Button variant="outline" size="sm" className="gap-2" disabled>
      <LogOut className="size-4" />
      Log out
    </Button>
  ) : (
    <CustomerLogoutButton businessSlug={businessSlug} />
  );

  return (
    <header
      className={
        hasTheme
          ? "sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          : "sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur-sm"
      }
      style={
        hasTheme
          ? {
              backgroundColor: branding!.themeColor!,
              color: branding!.textColor || "#fff",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 truncate">
        {branding?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt=""
            className="h-7 w-auto shrink-0 rounded object-contain"
          />
        )}
        <h1 className="truncate text-base font-semibold tracking-tight">
          {businessName}
        </h1>
      </div>
      {hasTheme ? (
        <div className="[&_button]:border-transparent [&_button]:bg-white/20 [&_button]:text-current [&_button]:shadow-none [&_button]:hover:bg-white/30 [&_button]:hover:text-current">
          {logoutButton}
        </div>
      ) : (
        logoutButton
      )}
    </header>
  );
}
