import { cn } from "@reelo/ui/lib/utils";
import * as React from "react";

interface DropdownButtonProps extends React.ComponentProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const DropdownButton = React.forwardRef<
  HTMLButtonElement,
  DropdownButtonProps
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "font-regular text-foreground hover:bg-accent focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:ring-ring data-[state=open]:hover:bg-accent relative inline-flex h-[26px] cursor-pointer items-center justify-center space-x-2 rounded-md border border-transparent px-1.5 py-4 text-center text-xs shadow-none outline-0 transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-1 [&_svg]:h-5 [&_svg]:w-5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownButton.displayName = "DropdownButton";
