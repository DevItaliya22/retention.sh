import { Skeleton } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { forwardRef } from "react";
import { ScaffoldContainer, ScaffoldSection } from "../Scaffold";

export interface PageLayoutSkeletonProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: boolean;
  subtitle?: boolean;
  primaryActions?: boolean;
  secondaryActions?: boolean;
  navigationItems?: number;
  size?: "default" | "full" | "large" | "small";
  isCompact?: boolean;
  isWidthFull?: boolean;
  scaffoldSectionClassName?: string;
}

/**
 * Skeleton version of PageLayout
 * Used for loading states when fetching page data
 *
 * @param title - Show skeleton for title (default: true)
 * @param subtitle - Show skeleton for subtitle (default: true)
 * @param primaryActions - Show skeleton for primary actions (default: false)
 * @param secondaryActions - Show skeleton for secondary actions (default: false)
 * @param navigationItems - Number of navigation items to show (default: 0)
 * @param size - Controls padding of the page header (default: 'default')
 * @param isCompact - Compact mode (default: false)
 * @param isWidthFull - Full width content (default: true)
 */
export const PageLayoutSkeleton = forwardRef<
  HTMLDivElement,
  PageLayoutSkeletonProps
>(
  (
    {
      className,
      title = true,
      subtitle = true,
      primaryActions = false,
      secondaryActions = false,
      navigationItems = 0,
      size = "default",
      isCompact = false,
      isWidthFull = true,
      scaffoldSectionClassName,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full min-h-full w-full flex-col items-stretch",
          className,
        )}
        {...props}
      >
        <ScaffoldContainer
          size={size}
          className={cn(
            "mx-auto w-full",
            size === "full" &&
              (isCompact
                ? "max-w-none border-b px-6! pt-4"
                : "max-w-none border-b px-10! pt-6"),
            size !== "full" && (isCompact ? "pt-4" : "pt-12"),
            navigationItems === 0 &&
              size === "full" &&
              (isCompact ? "pb-4" : "pb-8"),
          )}
        >
          {/* Header section skeleton */}
          {(title || subtitle || primaryActions || secondaryActions) && (
            <div
              className={cn(
                "flex w-full flex-col gap-4",
                isCompact ? "pb-2" : "pb-4",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  {title && <Skeleton className="h-8 w-64" />}
                  {subtitle && <Skeleton className="h-4 w-96" />}
                </div>
                <div className="flex items-center gap-2">
                  {secondaryActions && (
                    <>
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </>
                  )}
                  {primaryActions && <Skeleton className="h-9 w-32" />}
                </div>
              </div>
            </div>
          )}

          {/* Navigation section skeleton */}
          {navigationItems > 0 && (
            <div className={cn(isCompact ? "mt-2" : "mt-4", "flex gap-2")}>
              {Array.from({ length: navigationItems }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-24" />
              ))}
            </div>
          )}
        </ScaffoldContainer>
        <ScaffoldSection
          isFullWidth={isWidthFull}
          className={scaffoldSectionClassName}
        >
          {children || (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          )}
        </ScaffoldSection>
      </div>
    );
  },
);

PageLayoutSkeleton.displayName = "PageLayoutSkeleton";
