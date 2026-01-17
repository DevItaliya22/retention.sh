import { Skeleton } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { forwardRef, HTMLAttributes } from "react";
import { MAX_WIDTH_CLASSES_COLUMN, PADDING_CLASSES } from "./Scaffold";

/**
 * Skeleton version of ScaffoldContainer
 * Used for loading states when fetching data
 */
export const ScaffoldContainerSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    bottomPadding?: boolean;
    size?: "small" | "default" | "large" | "full";
  }
>(({ className, bottomPadding, size = "default", ...props }, ref) => {
  const maxWidthClass = {
    small: "max-w-[768px]",
    default: "max-w-[1200px]",
    large: "max-w-[1600px]",
    full: "max-w-none",
  }[size];

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "mx-auto w-full",
        maxWidthClass,
        PADDING_CLASSES,
        bottomPadding && "pb-16",
        className,
      )}
    />
  );
});

/**
 * Skeleton version of ScaffoldHeader
 * Used for loading states when fetching page header data
 */
export const ScaffoldHeaderSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <header
      {...props}
      ref={ref}
      className={cn("w-full flex-col gap-3 py-6", className)}
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </header>
  );
});

/**
 * Skeleton version of ScaffoldTitle
 * Used for loading states when fetching title data
 */
export const ScaffoldTitleSkeleton = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement> & {
    width?: string;
  }
>(({ className, width = "w-64", ...props }, ref) => {
  return (
    <Skeleton ref={ref} {...props} className={cn("h-8", width, className)} />
  );
});

/**
 * Skeleton version of ScaffoldDescription
 * Used for loading states when fetching description data
 */
export const ScaffoldDescriptionSkeleton = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement> & {
    width?: string;
  }
>(({ className, width = "w-96", ...props }, ref) => {
  return (
    <Skeleton ref={ref} {...props} className={cn("h-4", width, className)} />
  );
});

/**
 * Skeleton version of ScaffoldSection
 * Used for loading states when fetching section data
 */
export const ScaffoldSectionSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    isFullWidth?: boolean;
  }
>(({ className, isFullWidth, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "flex flex-col py-6 first:pt-12",
        isFullWidth ? "w-full" : "gap-3 md:grid-cols-12 lg:grid",
        className,
      )}
    />
  );
});

/**
 * Skeleton version of ScaffoldSectionTitle
 * Used for loading states when fetching section title data
 */
export const ScaffoldSectionTitleSkeleton = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement> & {
    width?: string;
  }
>(({ className, width = "w-48", ...props }, ref) => {
  return (
    <Skeleton ref={ref} {...props} className={cn("h-6", width, className)} />
  );
});

/**
 * Skeleton version of ScaffoldSectionDescription
 * Used for loading states when fetching section description data
 */
export const ScaffoldSectionDescriptionSkeleton = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement> & {
    width?: string;
  }
>(({ className, width = "w-96", ...props }, ref) => {
  return (
    <Skeleton ref={ref} {...props} className={cn("h-4", width, className)} />
  );
});

/**
 * Skeleton version of ScaffoldSectionDetail
 * Used for loading states when fetching section detail data
 */
export const ScaffoldSectionDetailSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("prose col-span-4 text-sm xl:col-span-5", className)}
    >
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
});

/**
 * Skeleton version of ScaffoldSectionContent
 * Used for loading states when fetching section content data
 */
export const ScaffoldSectionContentSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "col-span-8 xl:col-span-7",
        "flex flex-col gap-6",
        className,
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  );
});

/**
 * Skeleton version of ScaffoldActionsContainer
 * Used for loading states when fetching actions data
 */
export const ScaffoldActionsContainerSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("flex w-full items-center gap-3", className)}
    >
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
});

/**
 * Skeleton version of ScaffoldActionsGroup
 * Used for loading states when fetching action group data
 */
export const ScaffoldActionsGroupSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} {...props} className={cn("flex flex-row gap-3", className)}>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
});

/**
 * Skeleton version of ScaffoldColumn
 * Used for loading states when fetching column data
 */
export const ScaffoldColumnSkeleton = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn("flex flex-col gap-3", MAX_WIDTH_CLASSES_COLUMN, className)}
    >
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
    </div>
  );
});

ScaffoldContainerSkeleton.displayName = "ScaffoldContainerSkeleton";
ScaffoldHeaderSkeleton.displayName = "ScaffoldHeaderSkeleton";
ScaffoldTitleSkeleton.displayName = "ScaffoldTitleSkeleton";
ScaffoldDescriptionSkeleton.displayName = "ScaffoldDescriptionSkeleton";
ScaffoldSectionSkeleton.displayName = "ScaffoldSectionSkeleton";
ScaffoldSectionTitleSkeleton.displayName = "ScaffoldSectionTitleSkeleton";
ScaffoldSectionDescriptionSkeleton.displayName =
  "ScaffoldSectionDescriptionSkeleton";
ScaffoldSectionDetailSkeleton.displayName = "ScaffoldSectionDetailSkeleton";
ScaffoldSectionContentSkeleton.displayName = "ScaffoldSectionContentSkeleton";
ScaffoldActionsContainerSkeleton.displayName =
  "ScaffoldActionsContainerSkeleton";
ScaffoldActionsGroupSkeleton.displayName = "ScaffoldActionsGroupSkeleton";
ScaffoldColumnSkeleton.displayName = "ScaffoldColumnSkeleton";
