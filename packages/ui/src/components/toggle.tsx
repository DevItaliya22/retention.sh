"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ToggleProps
  extends
    React.ComponentProps<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  text?: string;
  icon?: React.ReactNode;
  shortcut?: string | React.ReactNode;
  disabledTooltip?: string;
  tooltip?: string;
  right?: React.ReactNode;
  textWrapperClassName?: string;
  shortcutClassName?: string;
}

function BaseToggleContent({
  text,
  icon,
  right,
  shortcut,
  textWrapperClassName,
  shortcutClassName,
  variant,
  children,
}: Pick<
  ToggleProps,
  | "text"
  | "icon"
  | "right"
  | "shortcut"
  | "textWrapperClassName"
  | "shortcutClassName"
  | "variant"
> & { children?: React.ReactNode }) {
  const contentText =
    text ?? (typeof children === "string" ? children : undefined);
  return (
    <>
      {icon}
      {contentText && (
        <div
          className={cn(
            "min-w-0 truncate",
            shortcut && "flex-1 text-left",
            textWrapperClassName,
          )}
        >
          {contentText}
        </div>
      )}
      {shortcut &&
        (typeof shortcut === "string" ? (
          <kbd
            className={cn(
              "hidden rounded px-2 py-0.5 text-xs font-light transition-all duration-75 md:inline-block",
              {
                "bg-primary/10 text-primary-foreground group-hover:bg-primary/20":
                  variant === "default",
                "bg-muted text-muted-foreground group-hover:bg-muted/80":
                  variant === "outline",
              },
              shortcutClassName,
            )}
          >
            {shortcut}
          </kbd>
        ) : (
          shortcut
        ))}
      {right}
    </>
  );
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  text,
  icon,
  shortcut,
  disabledTooltip,
  tooltip,
  right,
  textWrapperClassName,
  shortcutClassName,
  children,
  ...props
}: ToggleProps) {
  const element = (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    >
      <BaseToggleContent
        text={text}
        icon={icon}
        right={right}
        shortcut={shortcut}
        textWrapperClassName={textWrapperClassName}
        shortcutClassName={shortcutClassName}
        variant={variant}
      >
        {children}
      </BaseToggleContent>
    </TogglePrimitive.Root>
  );

  if (disabledTooltip && props.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              toggleVariants({ variant, size, className }),
              "cursor-not-allowed",
            )}
          >
            <BaseToggleContent
              text={text}
              icon={icon}
              right={right}
              shortcut={shortcut}
              textWrapperClassName={textWrapperClassName}
              shortcutClassName={shortcutClassName}
              variant={variant}
            >
              {children}
            </BaseToggleContent>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (tooltip && !props.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{element}</TooltipTrigger>
        <TooltipContent shortcut={shortcut}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return element;
}

export { Toggle, toggleVariants };
