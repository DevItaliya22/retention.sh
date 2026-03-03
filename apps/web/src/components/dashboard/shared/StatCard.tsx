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
}: StatCardProps) {
  if (isLoading || !stat) {
    return (
      <Card className="gap-2 py-4">
        <CardContent className="px-4">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="mb-1 h-7 w-24" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  const delta = getDelta(stat.value, stat.previousValue);

  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs font-medium">
          {stat.label}
        </p>
        <p className="text-foreground mt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {formatValue(stat.value, stat.format, currencySymbol)}
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
            Today: {formatValue(stat.todayValue, stat.format, currencySymbol)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
