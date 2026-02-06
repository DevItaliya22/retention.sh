"use client";

import { cn } from "@reelo/ui/lib/utils";

export type StepContentProps = {
  /** Step number badge (0-based stepIndex) */
  stepIndex?: number;
  totalSteps?: number;
  /** Main heading – rendered at full container width */
  title?: React.ReactNode;
  /** Subheading / helper text below title */
  description?: React.ReactNode;
  required?: boolean;
  className?: string;
  /** Form fields – rendered slightly narrower than heading */
  children: React.ReactNode;
};

export function StepContent({
  stepIndex,
  totalSteps,
  title,
  description,
  required,
  className,
  children,
}: StepContentProps) {
  const showBadge =
    typeof stepIndex === "number" &&
    typeof totalSteps === "number" &&
    totalSteps > 0;

  const hasHeader = title != null || description != null || showBadge;

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {/* Header: badge + title + description at full width */}
      {hasHeader && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {showBadge && (
              <span
                className="bg-foreground text-background mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                aria-hidden
              >
                {stepIndex! + 1}
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              {title != null && (
                <h2 className="text-foreground text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                  {title}
                  {required && (
                    <span className="text-foreground ml-1" aria-hidden>
                      *
                    </span>
                  )}
                </h2>
              )}
              {description != null && description !== "" && (
                <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fields: slightly narrower, with left offset matching heading text */}
      <div
        className={cn(
          "w-full space-y-6",
          hasHeader && "mt-8",
          showBadge && "pl-10",
        )}
      >
        {children}
      </div>
    </div>
  );
}
