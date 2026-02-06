"use client";

import * as React from "react";
import { cn } from "@reelo/ui/lib/utils";
import { Input } from "../input";

export type StepInputProps = React.ComponentProps<typeof Input>;

/**
 * Convenience alias for `<Input variant="underline" />`.
 * Use `Input` directly with `variant="underline"` if you prefer.
 */
export const StepInput = React.forwardRef<HTMLInputElement, StepInputProps>(
  function StepInput({ className, ...props }, ref) {
    return (
      <Input
        ref={ref}
        variant="underline"
        className={cn(className)}
        {...props}
      />
    );
  },
);
