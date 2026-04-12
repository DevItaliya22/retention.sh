import * as React from "react";
import { cn } from "../lib/utils";

function Textarea({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"textarea"> & {
  variant?: "default" | "underline";
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        variant === "underline"
          ? "text-foreground placeholder:text-muted-foreground/60 border-input focus-visible:border-primary aria-invalid:border-destructive flex field-sizing-content w-full min-w-0 resize-none border-0 border-b bg-transparent px-0 py-3 text-base leading-relaxed transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent"
          : cn(
              "border-input placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            ),
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
