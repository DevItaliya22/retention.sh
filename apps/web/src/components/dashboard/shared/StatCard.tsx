"use client";

import type { HighlightStat } from "@/lib/types/analytics";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { cn } from "@reelo/ui/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  stat?: HighlightStat;
  isLoading?: boolean;
  currencySymbol?: string;
  label?: string;
  format?: HighlightStat["format"];
}

function formatValue(
  value: number,
  format: HighlightStat["format"],
  currencySymbol: string,
): string {
  switch (format) {
    case "currency":
      return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return value.toLocaleString();
  }
}

function getDelta(
  current: number,
  previous: number,
): { value: number; isPositive: boolean } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { value: 100, isPositive: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

export function StatCard({
  stat,
  isLoading,
  currencySymbol = "$",
  label,
  format,
}: StatCardProps) {
  const displayLabel = stat?.label ?? label ?? "";
  const displayFormat = stat?.format ?? format ?? "number";

  if (isLoading || !stat) {
    return (
      <Card className="from-primary/10 dark:from-primary/15 relative gap-2 overflow-hidden bg-gradient-to-t to-transparent py-4">
        <CardContent className="px-4">
          <p className="text-muted-foreground text-xs font-medium">
            {displayLabel}
          </p>
          <div className="text-foreground mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            <Skeleton className="inline-block h-7 w-24" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Skeleton className="h-3 w-28" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Today:{" "}
              <span className="inline-block align-middle">
                <Skeleton className="inline-block h-3 w-14" />
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const delta = getDelta(stat.value, stat.previousValue);

  return (
    <Card className="from-primary/10 dark:from-primary/15 relative gap-2 overflow-hidden bg-gradient-to-t to-transparent py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs font-medium">
          {displayLabel}
        </p>
        <p className="text-foreground mt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {formatValue(stat.value, displayFormat, currencySymbol)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {delta !== null && (
            <div className="flex items-center gap-1">
              {delta.isPositive ? (
                <TrendingUp className="size-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="size-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  delta.isPositive ? "text-emerald-600" : "text-red-500",
                )}
              >
                {delta.value.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs">
                vs prev period
              </span>
            </div>
          )}
          <p className="text-muted-foreground text-[11px] tabular-nums">
            Today: {formatValue(stat.todayValue, displayFormat, currencySymbol)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
