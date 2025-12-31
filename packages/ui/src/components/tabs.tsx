"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, VariantProps } from "class-variance-authority";
import { LayoutGroup, motion } from "framer-motion";
import * as React from "react";
import { useId } from "react";
import { cn } from "../lib/utils";

const tabSelectButtonVariants = cva("px-4 py-2 transition-colors duration-75", {
  variants: {
    variant: {
      default:
        "text-foreground-lighter data-[selected=true]:text-foreground data-[selected=false]:hover:text-foreground-light",
      accent:
        "text-foreground-lighter transition-[color,font-weight] data-[selected=true]:text-blue-600 data-[selected=false]:hover:text-foreground-light data-[selected=true]:font-medium",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const tabSelectIndicatorVariants = cva("absolute bottom-0 w-full px-1.5", {
  variants: {
    variant: {
      default: "text-foreground",
      accent: "text-blue-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface TabSelectOption {
  id: string;
  label: string;
  href?: string;
  target?: string;
}

export interface TabSelectProps<T extends string> extends VariantProps<
  typeof tabSelectButtonVariants
> {
  options: TabSelectOption[];
  selected: string | null;
  onSelect?: ((id: T) => void) | React.Dispatch<React.SetStateAction<T>>;
  className?: string;
}

function TabSelect<T extends string>({
  variant,
  options,
  selected,
  onSelect,
  className,
}: TabSelectProps<T>) {
  const layoutGroupId = useId();

  return (
    <div className={cn("flex text-sm", className)}>
      <LayoutGroup id={layoutGroupId}>
        {options.map(({ id, label, href, target }) => {
          const isSelected = id === selected;
          const As = href ? "a" : "div";
          return (
            <As
              key={id}
              className="relative"
              href={href ?? "#"}
              target={target ?? undefined}
            >
              <button
                type="button"
                {...(onSelect && !href && { onClick: () => onSelect(id as T) })}
                className={cn(
                  tabSelectButtonVariants({ variant }),
                  target === "_blank" && "group flex items-center gap-1.5",
                )}
                data-selected={isSelected}
                aria-selected={isSelected}
              >
                {label}
                {target === "_blank" && (
                  <svg
                    className="size-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </button>
              {isSelected && (
                <motion.div
                  layoutId="indicator"
                  transition={{
                    duration: 0.1,
                  }}
                  className={tabSelectIndicatorVariants({ variant })}
                >
                  <div className="h-0.5 rounded-t-full bg-current" />
                </motion.div>
              )}
            </As>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

const tabsListVariants = cva(
  "inline-flex space-x-1.5  w-fit items-center justify-center rounded-lg p-1.5",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        outline: "border border-border",
        ghost: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const tabsTriggerVariants = cva(
  "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-3 py-1.5 text-sm font-medium transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: [
          "text-foreground-lighter",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
        ],
        outline: [
          "text-foreground-lighter",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
        ],
        ghost: [
          "text-foreground-lighter hover:text-foreground-light",
          "data-[state=active]:text-foreground data-[state=active]:bg-muted",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabSelect, TabsList, TabsTrigger };
