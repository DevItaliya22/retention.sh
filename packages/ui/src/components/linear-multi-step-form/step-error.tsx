"use client";

import { cn } from "@reelo/ui/lib/utils";
import { AlertTriangle } from "lucide-react";

export type StepErrorProps = {
  message: string;
  className?: string;
};

export function StepError({ message, className }: StepErrorProps) {
  return (
    <div
      className={cn(
        "bg-destructive/10 text-destructive border-destructive/30 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}
