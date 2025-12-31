"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border-input bg-background flex items-center gap-0 rounded-md border shadow-xs",
        className,
      )}
      {...props}
    />
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      className={cn(
        "min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ className, ...props }, ref) => {
  return (
    <Textarea
      ref={ref}
      className={cn(
        "resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = "InputGroupTextarea";

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "inline-start", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-foreground-lighter flex shrink-0 items-center gap-1 px-3 text-sm",
          align === "inline-end" && "ml-auto",
          align === "block-start" && "w-full border-b pb-2",
          align === "block-end" && "w-full border-t pt-2",
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn("text-foreground-lighter text-sm", className)}
      {...props}
    />
  );
});
InputGroupText.displayName = "InputGroupText";

const InputGroupButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn("h-auto border-0 shadow-none", className)}
        {...props}
      />
    );
  },
);
InputGroupButton.displayName = "InputGroupButton";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
};
