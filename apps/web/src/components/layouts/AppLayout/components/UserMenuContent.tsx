"use client";

import { useSessionContext } from "@/hooks/misc/useSessionContext";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@reelo/ui/components/avatar";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@reelo/ui/components/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@reelo/ui/components/toggleGroup";
import { LogOut, Mail, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface UserMenuContentProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  onContactClick?: () => void;
}

export function UserMenuContent({
  user,
  onContactClick,
}: UserMenuContentProps) {
  const { signOut } = useSessionContext();
  const { theme, setTheme } = useTheme();

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

  const handleLogOut = async () => {
    await signOut();
  };

  const themeOptions = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ] as const;

  const currentTheme = theme ?? "system";

  return (
    <>
      {/* User Info Header */}
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={undefined} alt={user.name || user.email} />
            <AvatarFallback className="rounded-lg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {user.name || user.email.split("@")[0]}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
        </div>
      </DropdownMenuLabel>

      {/* Theme Selector */}
      <DropdownMenuSeparator />
      <div className="just flex items-center justify-between gap-2 px-2 py-1.5">
        <span className="text-foreground text-xs font-medium">Theme</span>
        <ToggleGroup
          type="single"
          value={currentTheme}
          onValueChange={(value) => {
            if (value) setTheme(value);
          }}
          className="rounded-full"
          variant="outline"
          size="sm"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={`Toggle ${option.value} theme`}
                className="px-2!"
              >
                <Icon className="h-4 w-4" />
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
      {/* Actions */}
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={() => {
            onContactClick?.();
          }}
          className="cursor-pointer"
        >
          <Mail className="h-4 w-4" />
          <span className="text-xs">Contact Us</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
