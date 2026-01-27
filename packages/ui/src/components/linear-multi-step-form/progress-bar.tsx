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
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        <span className="text-muted-foreground ml-auto text-sm">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
