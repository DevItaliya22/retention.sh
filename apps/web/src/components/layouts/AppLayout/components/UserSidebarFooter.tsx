"use client";

import { useSessionContext } from "@/hooks/auth/useSessionContext";
import { DropdownButton } from "@reelo/ui/components/dropdown-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@reelo/ui/components/dropdown-menu";
import { useSidebar } from "@reelo/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@reelo/ui/components/tooltip";
import { ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { UserMenuContent } from "./UserMenuContent";

interface UserSidebarFooterProps {
  className?: string;
  isCollapsed?: boolean;
  onContactClick?: () => void;
}

export function UserSidebarFooter({
  className,
  isCollapsed = false,
  onContactClick,
}: UserSidebarFooterProps = {}) {
  const { user, isLoading } = useSessionContext();
  const { isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <div className="bg-muted h-8 w-8 animate-pulse rounded-xl" />
        {!isCollapsed && (
          <div className="bg-muted h-4 w-24 animate-pulse rounded-md" />
        )}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0]!.toUpperCase()
      : "U";

  const displayName =
    user.name || (user.email ? user.email.split("@")[0] : null) || "User";

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="flex items-center gap-2">
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold">
                  {userInitials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p>{displayName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold">
              {userInitials}
            </div>

            <div className="min-w-0">
              <span className="text-foreground block max-w-32 truncate text-sm font-medium md:block lg:max-w-none">
                {displayName}
              </span>
              <span className="text-foreground-lighter block max-w-32 truncate text-xs md:block lg:max-w-none">
                Account
              </span>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <DropdownButton aria-label="User options" aria-haspopup="dialog">
              <div className="text-foreground-lighter [&_svg]:h-[14px] [&_svg]:w-[14px]">
                <ChevronsUpDown className="h-[14px] w-[14px]" />
              </div>
            </DropdownButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72"
            align="start"
            aria-label="User menu"
            side={isMobile ? "bottom" : "top"}
            sideOffset={4}
          >
            <UserMenuContent
              user={{
                id: user.id,
                name: user.name,
                email: user.email || "",
              }}
              onContactClick={onContactClick}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
