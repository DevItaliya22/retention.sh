"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogProps } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { VariantProps, cva } from "class-variance-authority";
import { cn } from "../lib/utils";

export const DIALOG_PADDING_Y_SMALL = "py-4";
export const DIALOG_PADDING_X_SMALL = "px-4 md:px-5";

export const DIALOG_PADDING_Y = "py-6";
export const DIALOG_PADDING_X = "px-4 md:px-7";

const DialogPaddingVariants = cva("", {
  variants: {
    padding: {
      medium: `${DIALOG_PADDING_Y} ${DIALOG_PADDING_X}`,
      small: `${DIALOG_PADDING_Y_SMALL} ${DIALOG_PADDING_X_SMALL}`,
    },
  },
  defaultVariants: {
    padding: "small",
  },
});

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = (props: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props} />
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    centered?: boolean;
  }
>(({ className, centered = true, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "bg-black/40 backdrop-blur-sm",
      "data-closed:animate-overlay-hide fixed inset-0 z-50 grid place-items-center overflow-y-auto py-8",
      !centered &&
        "flex-start flex flex-col px-5 pb-8 sm:pt-12 md:pt-20 lg:pt-32 xl:pt-40",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContentVariants = cva(
  cn(
    "relative z-50 w-full max-w-screen border shadow-md dark:shadow-sm",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=closed]:slide-out-to-left-[0%] data-[state=closed]:slide-out-to-top-[0%]",
    "data-[state=open]:slide-in-from-left-[0%] data-[state=open]:slide-in-from-top-[0%]",
    "sm:rounded-lg md:w-full",
    "bg-background",
  ),
  {
    variants: {
      size: {
        tiny: `sm:align-middle sm:w-full sm:max-w-xs`,
        small: `sm:align-middle sm:w-full sm:max-w-sm`,
        medium: `sm:align-middle sm:w-full sm:max-w-lg`,
        large: `sm:align-middle sm:w-full md:max-w-xl`,
        xlarge: `sm:align-middle sm:w-full md:max-w-3xl`,
        xxlarge: `sm:align-middle sm:w-full md:max-w-6xl`,
        xxxlarge: `sm:align-middle sm:w-full md:max-w-7xl`,
      },
    },
    defaultVariants: {
      size: "medium",
    },
  },
);

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof DialogContentVariants> & {
      hideClose?: boolean;
      dialogOverlayProps?: React.ComponentPropsWithoutRef<typeof DialogOverlay>;
      centered?: boolean;
      container?: HTMLElement;
    }
>(
  (
    {
      className,
      children,
      size,
      hideClose,
      dialogOverlayProps,
      centered = true,
      container,
      ...props
    },
    ref,
  ) => (
    <DialogPortal container={container}>
      <DialogOverlay centered={centered} {...dialogOverlayProps}>
        <DialogPrimitive.Content
          ref={ref}
          className={cn(DialogContentVariants({ size }), className)}
          {...props}
        >
          {children}
          {!hideClose && (
            <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground-muted absolute top-4 right-4 rounded-sm opacity-20 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof DialogPaddingVariants>
>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      "flex flex-col gap-1.5 text-center sm:text-left",
      DialogPaddingVariants({ padding }),
      className,
    )}
  />
));
DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof DialogPaddingVariants>
>(({ className, children, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      "border-t",
      DialogPaddingVariants({ padding }),
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base leading-none font-normal", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-foreground-lighter text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground-muted opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none",
      className,
    )}
    {...props}
  >
    {children}
  </DialogPrimitive.Close>
));
DialogClose.displayName = DialogPrimitive.Close.displayName;

const DialogSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof DialogPaddingVariants>
>(({ className, children, padding, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn(
      DialogPaddingVariants({ padding }),
      "overflow-hidden",
      className,
    )}
  >
    {children}
  </div>
));
DialogSection.displayName = "DialogSection";

const DialogSectionSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className={cn("bg-border h-px w-full", className)}
  />
));
DialogSectionSeparator.displayName = "DialogSectionSeparator";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
};
