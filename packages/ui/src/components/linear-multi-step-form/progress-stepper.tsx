"use client";

import { cn } from "@reelo/ui/lib/utils";
import { Check } from "lucide-react";

export function ProgressStepper({
  steps,
  currentStepIndex,
  totalSteps,
  getStepStatus,
  getStepError,
  isStepRequired,
  isStepAccessible,
  goToStep,
  className,
}: {
  steps: Array<{ id: string; title?: string; description?: string }>;
  currentStepIndex: number;
  totalSteps: number;
  getStepStatus: (
    stepIndex: number,
  ) => "complete" | "current" | "pending" | "invalid";
  getStepError: (stepIndex: number) => string | null;
  isStepRequired: (stepIndex: number) => boolean;
  isStepAccessible: (stepIndex: number) => boolean;
  goToStep: (stepIndex: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isAccessible = isStepAccessible(index);
          const isClickable = isAccessible && index !== currentStepIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <button
                  type="button"
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                    status === "complete" &&
                      "bg-primary border-primary text-primary-foreground",
                    status === "current" &&
                      "bg-primary border-primary text-primary-foreground ring-primary/20 ring-4",
                    status === "pending" &&
                      "bg-background border-muted-foreground/30 text-muted-foreground",
                    status === "invalid" &&
                      "bg-destructive/10 border-destructive text-destructive",
                    isClickable && "hover:border-primary/50 cursor-pointer",
                    !isClickable && "cursor-not-allowed opacity-50",
                  )}
                  aria-label={`Step ${index + 1}: ${step.title || step.id}`}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "complete" ? (
                    <Check className="size-5" />
                  ) : status === "invalid" ? (
                    <span className="text-xs font-bold">!</span>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 max-w-[120px] text-center">
                  {step.title && (
                    <div
                      className={cn(
                        "flex items-center justify-center gap-1 text-xs font-medium",
                        status === "current" && "text-foreground",
                        status !== "current" && "text-muted-foreground",
                        status === "invalid" && "text-destructive",
                      )}
                    >
                      <span>{step.title}</span>
                      {isStepRequired(index) && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>
                  )}
                  {step.description && (
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {step.description}
                    </div>
                  )}
                  {status === "invalid" && getStepError(index) && (
                    <div className="text-destructive mt-1 line-clamp-2 text-xs font-medium">
                      {getStepError(index)}
                    </div>
                  )}
                </div>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    getStepStatus(index) === "complete"
                      ? "bg-primary"
                      : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
