import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@reelo/ui/lib/utils";
import { Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 px-8 has-[>svg]:px-4",
        icon: "size-9",
        xs: "size-[22px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  shortcut?: string | React.ReactNode;
  disabledTooltip?: string;
  tooltip?: string;
  loading?: boolean;
  right?: React.ReactNode;
  textWrapperClassName?: string;
  shortcutClassName?: string;
  rounded?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      className,
      textWrapperClassName,
      shortcutClassName,
      loading,
      icon,
      shortcut,
      disabledTooltip,
      tooltip,
      right,
      asChild = false,
      size,
      rounded = false,
      ...props
    },
    forwardedRef,
  ) => {
    // When asChild, Slot expects exactly one child – pass only props.children
    if (asChild) {
      return (
        <Slot
          ref={forwardedRef}
          data-slot="button"
          className={cn(
            buttonVariants({ variant, size }),
            rounded ? "rounded-full" : "",
            props.disabled || loading
              ? "border-input bg-muted text-muted-foreground cursor-not-allowed outline-none"
              : "",
            className,
          )}
          {...props}
        >
          {props.children}
        </Slot>
      );
    }

    const Comp = "button";

    // If disabled with tooltip, show disabled state with tooltip
    if (disabledTooltip && props.disabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "border-input bg-muted text-muted-foreground flex w-full cursor-not-allowed items-center justify-center gap-x-2 border px-4 text-sm transition-all focus:outline-none",
                {
                  "rounded-full": rounded,
                  "rounded-md": !rounded,
                  "border-transparent bg-transparent": variant === "outline",
                },
                className,
              )}
            >
              {icon}
              {props.children && typeof props.children === "string" ? (
                <div
                  className={cn(
                    "min-w-0 truncate",
                    shortcut && "flex-1 text-left",
                    textWrapperClassName,
                  )}
                >
                  {props.children}
                </div>
              ) : (
                props.children
              )}
              {shortcut && (
                <kbd
                  className={cn(
                    "border-input bg-muted text-muted-foreground hidden rounded border px-2 py-0.5 text-xs font-light md:inline-block",
                    {
                      "bg-muted": variant === "outline",
                    },
                    shortcutClassName,
                  )}
                >
                  {shortcut}
                </kbd>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    const buttonElement = (
      <Comp
        ref={forwardedRef}
        data-slot="button"
        // if onClick is passed, it's a "button" type, otherwise it's being used in a form, hence "submit"
        type={props.onClick ? "button" : "submit"}
        className={cn(
          buttonVariants({ variant, size }),
          rounded ? "rounded-full" : "",
          props.disabled || loading
            ? "border-input bg-muted text-muted-foreground cursor-not-allowed outline-none"
            : "",
          className,
        )}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {props.children && typeof props.children === "string" ? (
          <div
            className={cn(
              "min-w-0 truncate",
              shortcut && "flex-1 text-left",
              textWrapperClassName,
            )}
          >
            {props.children}
          </div>
        ) : (
          props.children
        )}
        {shortcut &&
          !tooltip &&
          (typeof shortcut === "string" ? (
            <kbd
              className={cn(
                "hidden rounded px-2 py-0.5 text-xs font-light transition-all duration-75 md:inline-block",
                {
                  "bg-primary/10 text-primary-foreground group-hover:bg-primary/20":
                    variant === "default",
                  "bg-secondary text-secondary-foreground group-hover:bg-secondary/80":
                    variant === "secondary",
                  "bg-muted text-muted-foreground group-hover:bg-muted/80":
                    variant === "outline",
                  "bg-destructive/10 text-destructive group-hover:bg-destructive/20":
                    variant === "destructive",
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
      </Comp>
    );

    // If tooltip is provided and button is not disabled, wrap with tooltip
    if (tooltip && !props.disabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent shortcut={shortcut}>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonElement;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
