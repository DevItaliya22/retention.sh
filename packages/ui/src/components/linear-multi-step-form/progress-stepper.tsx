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
  getStepStatus: (stepIndex: number) => "complete" | "current" | "pending" | "invalid";
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
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center size-10 rounded-full border-2 transition-colors",
                    status === "complete" &&
                      "bg-primary border-primary text-primary-foreground",
                    status === "current" &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                    status === "pending" &&
                      "bg-background border-muted-foreground/30 text-muted-foreground",
                    status === "invalid" &&
                      "bg-destructive/10 border-destructive text-destructive",
                    isClickable && "cursor-pointer hover:border-primary/50",
                    !isClickable && "cursor-not-allowed opacity-50"
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
                <div className="mt-2 text-center max-w-[120px]">
                  {step.title && (
                    <div
                      className={cn(
                        "text-xs font-medium flex items-center justify-center gap-1",
                        status === "current" && "text-foreground",
                        status !== "current" && "text-muted-foreground",
                        status === "invalid" && "text-destructive"
                      )}
                    >
                      <span>{step.title}</span>
                      {isStepRequired(index) && (
                        <span className="text-destructive">*</span>
                      )}
                    </div>
                  )}
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </div>
                  )}
                  {status === "invalid" && getStepError(index) && (
                    <div className="text-xs text-destructive mt-1 font-medium line-clamp-2">
                      {getStepError(index)}
                    </div>
                  )}
                </div>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    getStepStatus(index) === "complete"
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
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
