import * as React from "react";

import { cn } from "@reelo/ui/lib/utils";

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & {
  variant?: "default" | "underline";
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        variant === "underline"
          ? "text-foreground placeholder:text-muted-foreground/60 border-input focus-visible:border-primary flex h-auto w-full min-w-0 border-0 border-b bg-transparent dark:bg-transparent px-0 py-3 text-base outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
          : cn(
              "file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            ),
        className,
      )}
      {...props}
    />
  );
}

export { Input };
