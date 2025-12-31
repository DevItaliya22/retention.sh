"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils";
import { toggleVariants } from "./toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

interface ToggleGroupItemProps
  extends
    React.ComponentProps<typeof ToggleGroupPrimitive.Item>,
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

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  text,
  icon,
  shortcut,
  disabledTooltip,
  tooltip,
  right,
  textWrapperClassName,
  shortcutClassName,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);

  const content = (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10",
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {/* Content mirroring Button layout */}
      {icon}
      {(text || typeof children === "string") && (
        <div
          className={cn(
            "min-w-0 truncate",
            shortcut && "flex-1 text-left",
            textWrapperClassName,
          )}
        >
          {text ??
            (typeof children === "string" ? (children as string) : undefined)}
        </div>
      )}
      {shortcut &&
        (typeof shortcut === "string" ? (
          <kbd
            className={cn(
              "hidden rounded px-2 py-0.5 text-xs font-light transition-all duration-75 md:inline-block",
              {
                "bg-primary/10 text-primary-foreground group-hover:bg-primary/20":
                  (context.variant || variant) === "default",
                "bg-muted text-muted-foreground group-hover:bg-muted/80":
                  (context.variant || variant) === "outline",
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
      {/* Preserve non-string children when provided */}
      {text || typeof children === "string" ? null : children}
    </ToggleGroupPrimitive.Item>
  );

  if (disabledTooltip && props.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              toggleVariants({
                variant: context.variant || variant,
                size: context.size || size,
              }),
              "w-auto min-w-0 shrink-0 cursor-not-allowed px-3",
              className,
            )}
          >
            {icon}
            {text && (
              <div
                className={cn(
                  "min-w-0 truncate",
                  shortcut && "flex-1 text-left",
                  textWrapperClassName,
                )}
              >
                {text}
              </div>
            )}
            {shortcut &&
              (typeof shortcut === "string" ? (
                <kbd
                  className={cn(
                    "hidden rounded px-2 py-0.5 text-xs font-light md:inline-block",
                    shortcutClassName,
                  )}
                >
                  {shortcut}
                </kbd>
              ) : (
                shortcut
              ))}
            {right}
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
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent shortcut={shortcut}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export { ToggleGroup, ToggleGroupItem };
