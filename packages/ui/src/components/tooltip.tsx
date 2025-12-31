"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@reelo/ui/lib/utils";
import { Kbd } from "./kbd";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

interface TooltipContentProps extends React.ComponentProps<
  typeof TooltipPrimitive.Content
> {
  shortcut?: string | React.ReactNode;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  shortcut,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span>{children}</span>
          {shortcut &&
            (typeof shortcut === "string" ? (
              <Kbd className="bg-background/20 text-background">{shortcut}</Kbd>
            ) : (
              shortcut
            ))}
        </div>
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

interface InfoTooltipProps {
  content: string;
  className?: string;
  contentClassName?: string;
  shortcut?: string | React.ReactNode;
}

function InfoTooltip({
  content,
  className,
  contentClassName,
  shortcut,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`text-muted-foreground hover:text-foreground transition-colors ${className}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent
        className={cn("max-w-xs text-center", contentClassName)}
        shortcut={shortcut}
      >
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export {
  InfoTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};
