"use client";

import type { SetupChecklistPayload } from "@/lib/utils/setup-checklist";
import { cn } from "@reelo/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type SetupChecklistSummaryProps = {
  checklist: SetupChecklistPayload;
  className?: string;
  /** Larger typography and spacing for dashboard card */
  variant?: "compact" | "comfortable";
};

export function SetupChecklistSummary({
  checklist,
  className,
  variant = "compact",
}: SetupChecklistSummaryProps) {
  const incomplete = checklist.items.filter((i) => !i.done);
  const isComfortable = variant === "comfortable";

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "text-muted-foreground font-medium",
          isComfortable ? "text-sm" : "text-xs",
        )}
      >
        {checklist.completedCount}/{checklist.total} completed
      </div>
      <div
        className={cn(
          "bg-muted h-1.5 w-full overflow-hidden rounded-full",
          isComfortable && "h-2",
        )}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{
            width: `${checklist.total ? (checklist.completedCount / checklist.total) * 100 : 0}%`,
          }}
        />
      </div>
      {incomplete.length > 0 && (
        <ul className={cn("flex flex-col", isComfortable ? "gap-3" : "gap-2")}>
          {incomplete.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "border-border bg-background hover:border-primary/35 hover:bg-muted/40 focus-visible:ring-ring block w-full rounded-lg border text-left shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  isComfortable ? "p-4" : "p-3",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className={cn(
                        "text-foreground font-semibold tracking-tight",
                        isComfortable ? "text-sm" : "text-xs",
                      )}
                    >
                      {item.title}
                    </p>
                    <p
                      className={cn(
                        "text-muted-foreground leading-snug",
                        isComfortable ? "text-sm" : "text-xs",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-md font-medium",
                      isComfortable
                        ? "px-3 py-2 text-sm"
                        : "px-2.5 py-1.5 text-xs",
                    )}
                  >
                    Start
                    <ArrowRight
                      className={cn(isComfortable ? "size-4" : "size-3.5")}
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
