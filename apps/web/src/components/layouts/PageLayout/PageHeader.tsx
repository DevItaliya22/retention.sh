"use client";
import { ReactNode } from "react";

import { cn } from "@reelo/ui/lib/utils";
import { ScaffoldDescription, ScaffoldTitle } from "../Scaffold";

interface PageHeaderProps {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  primaryActions?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
  isCompact?: boolean;
}

export const PageHeader = ({
  title,
  subtitle,
  icon,
  primaryActions,
  secondaryActions,
  className,
  isCompact = false,
}: PageHeaderProps) => {
  const hasCompactActions = Boolean(primaryActions || secondaryActions);

  return (
    <div className={cn(isCompact ? "space-y-0" : "space-y-4", className)}>
      {isCompact && (title || primaryActions || secondaryActions) && (
        <div
          className={cn(
            "flex items-center gap-2",
            hasCompactActions ? "justify-between" : "justify-start",
          )}
        >
          <div className="flex items-center gap-2">{title}</div>
          {hasCompactActions && (
            <div className="flex items-center gap-2">
              {secondaryActions && (
                <div className="flex items-center gap-2">
                  {secondaryActions}
                </div>
              )}
              {primaryActions && (
                <div className="flex items-center gap-2">{primaryActions}</div>
              )}
            </div>
          )}
        </div>
      )}

      {!isCompact && (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {icon && <div className="text-foreground-light">{icon}</div>}
              <div className="space-y-1">
                {title && (
                  <ScaffoldTitle className="font-display font-medium">
                    {title}
                  </ScaffoldTitle>
                )}
                {subtitle && (
                  <ScaffoldDescription className="text-foreground-light text-sm">
                    {subtitle}
                  </ScaffoldDescription>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {secondaryActions && (
              <div className="flex items-center gap-2">{secondaryActions}</div>
            )}
            {primaryActions && (
              <div className="flex items-center gap-2">{primaryActions}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
