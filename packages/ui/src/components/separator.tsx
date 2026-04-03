"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "@reelo/ui/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border dark:bg-border/90 relative shrink-0 overflow-visible data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=horizontal]:shadow-[0_1px_0_rgba(255,255,255,0.65),0_2px_3px_rgba(15,23,42,0.06)] data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px data-[orientation=vertical]:shadow-[1px_0_0_rgba(255,255,255,0.6),2px_0_3px_rgba(15,23,42,0.05)] dark:data-[orientation=horizontal]:shadow-[0_1px_0_rgba(255,255,255,0.08),0_2px_3px_rgba(0,0,0,0.32)] dark:data-[orientation=vertical]:shadow-[1px_0_0_rgba(255,255,255,0.08),2px_0_3px_rgba(0,0,0,0.28)]",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
