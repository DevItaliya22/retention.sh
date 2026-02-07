"use client";

import { cn } from "@reelo/ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";

export interface PasswordInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type"
> {
  variant?: "default" | "underline";
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const isUnderline = variant === "underline";

    return (
      <div className={cn("relative w-full", className)}>
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          variant={variant}
          className={isUnderline ? "pr-9" : "pr-9"}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-muted-foreground hover:text-foreground absolute right-0 shrink-0",
            isUnderline
              ? "top-1.5 h-8 w-8 hover:bg-transparent"
              : "top-0 h-9 w-9",
          )}
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
