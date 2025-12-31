"use client";

import { Info } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface InfoIconProps {
  /**
   * Tooltip content to display on hover
   */
  content: string;
  /**
   * Additional className for the icon
   */
  className?: string;
  /**
   * Size of the icon (default: 14)
   */
  size?: number;
}

export function InfoIcon({ content, className, size = 14 }: InfoIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-foreground-lighter hover:text-foreground inline-flex cursor-help items-center",
            className,
          )}
          aria-label="More information"
        >
          <Info className="h-3.5 w-3.5" style={{ width: size, height: size }} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-center text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
