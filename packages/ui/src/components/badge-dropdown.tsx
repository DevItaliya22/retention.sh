"use client";

import { ChevronDown, Lock } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface BadgeDropdownOption<T extends string> {
  label: string;
  value: T;
}

export interface BadgeDropdownProps<T extends string> {
  value: T;
  options: BadgeDropdownOption<T>[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  badgeClassName?: string;
  align?: "start" | "center" | "end";
  disabledIcon?: React.ReactNode;
  dropdownIcon?: React.ReactNode;
}

export function BadgeDropdown<T extends string>({
  value,
  options,
  onValueChange,
  disabled = false,
  className,
  badgeClassName,
  align = "center",
  disabledIcon = <Lock className="h-3 w-3" />,
  dropdownIcon = <ChevronDown className="h-3 w-3" />,
}: BadgeDropdownProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);

  if (disabled) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Badge
          variant="outline"
          className={cn("inline-flex items-center gap-1.5", badgeClassName)}
        >
          <span className="shrink-0">{selectedOption?.label || value}</span>
          {disabledIcon && (
            <span className="text-foreground-muted flex shrink-0 items-center opacity-70">
              {disabledIcon}
            </span>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus:ring-ring inline-flex cursor-pointer items-center rounded-sm transition-opacity hover:opacity-80 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            aria-label={`Change ${selectedOption?.label || value}`}
          >
            <Badge
              variant="outline"
              className={cn(
                "pointer-events-none inline-flex items-center gap-1.5",
                badgeClassName,
              )}
            >
              <span className="shrink-0">{selectedOption?.label || value}</span>
              {dropdownIcon && (
                <span className="text-foreground-muted flex shrink-0 items-center opacity-70">
                  {dropdownIcon}
                </span>
              )}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                if (option.value !== value) {
                  onValueChange(option.value);
                }
              }}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
