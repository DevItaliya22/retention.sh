"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@reelo/ui/components";
import { ChevronDown } from "lucide-react";

interface SplitActionButtonItem {
  label: string;
  onSelect: () => void;
}

interface SplitActionButtonProps {
  label: string;
  onPrimaryClick: () => void;
  items: SplitActionButtonItem[];
  disabled?: boolean;
}

export function SplitActionButton({
  label,
  onPrimaryClick,
  items,
  disabled,
}: SplitActionButtonProps) {
  return (
    <div className="inline-flex items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-r-none border-r-0"
        disabled={disabled}
        onClick={onPrimaryClick}
      >
        {label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-l-none px-2"
            disabled={disabled}
            aria-label={`${label} actions`}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={item.onSelect}
              className="cursor-pointer"
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
