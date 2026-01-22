"use client";

import { cn } from "@reelo/ui/lib/utils";

export function ProgressBar({
  currentStepIndex,
  totalSteps,
  progress,
  className,
}: {
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground ml-auto">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
