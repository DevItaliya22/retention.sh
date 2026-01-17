"use client";

import { useSessionContext } from "@/hooks/misc/useSessionContext";
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
import { UserMenuContent } from "./UserMenuContent";

interface UserSidebarFooterProps {
  className?: string;
  isCollapsed?: boolean;
}

export function UserSidebarFooter({
  className,
  isCollapsed = false,
}: UserSidebarFooterProps = {}) {
  const { user } = useSessionContext();
  const { isMobile } = useSidebar();

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
                <div className="text-primary-foreground bg-primary flex h-8 w-8 items-center justify-center rounded-md font-medium">
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
            <div className="text-primary-foreground bg-primary flex h-6 w-6 items-center justify-center rounded-md text-xs font-medium">
              {userInitials}
            </div>

            <span className="text-foreground hidden max-w-32 truncate text-sm md:block lg:max-w-none">
              {displayName}
            </span>
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
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
