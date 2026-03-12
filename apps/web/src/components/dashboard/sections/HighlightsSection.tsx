"use client";

import { useHighlightsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import type { HighlightStat } from "@/lib/types/analytics";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { cn } from "@reelo/ui/lib/utils";
import { useState } from "react";
import { CustomerOne } from "../../svg/customer-one";
import { PeriodSelector, SectionHeader } from "../shared";

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

function IllustratedHighlightCard(props: {
  title: string;
  stat?: HighlightStat;
  isLoading: boolean;
  currencySymbol: string;
  format: HighlightStat["format"];
}) {
  const { title, stat, isLoading, currencySymbol, format } = props;

  const delta = stat ? getDelta(stat.value, stat.previousValue) : null;

  return (
    <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
      <CardContent className="relative min-h-[84px] px-4 pb-3 sm:min-h-[104px] sm:px-5 sm:pt-2 sm:pb-4">
        <div className="pr-20 sm:pr-24 xl:pr-28">
          <p className="text-muted-foreground text-xs font-medium">{title}</p>

          <div className="mt-1.5">
            {isLoading || !stat ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-foreground text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">
                {formatValue(stat.value, format, currencySymbol)}
              </p>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-1.5">
            {isLoading || !stat ? (
              <Skeleton className="h-3 w-20" />
            ) : delta ? (
              <>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    delta.isPositive
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-destructive",
                  )}
                >
                  {delta.isPositive ? "+" : "-"}
                  {delta.value.toFixed(1)}%
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        </div>
      </CardContent>
      <CustomerOne className="text-primary pointer-events-none absolute right-0 bottom-0 h-28 w-28 sm:h-28 sm:w-28 xl:h-32 xl:w-32" />
    </Card>
  );
}

export function HighlightsSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useHighlightsQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Highlights"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IllustratedHighlightCard
          title="Total sales"
          stat={isLoading ? undefined : data?.totalSales}
          isLoading={isLoading}
          currencySymbol={currencySymbol}
          format="currency"
        />
        <IllustratedHighlightCard
          title="Total orders"
          stat={isLoading ? undefined : data?.totalOrders}
          isLoading={isLoading}
          currencySymbol={currencySymbol}
          format="number"
        />
        <IllustratedHighlightCard
          title="Customers"
          stat={isLoading ? undefined : data?.newCustomers}
          isLoading={isLoading}
          currencySymbol={currencySymbol}
          format="number"
        />
        <IllustratedHighlightCard
          title="Repeat customers"
          stat={isLoading ? undefined : data?.repeatCustomers}
          isLoading={isLoading}
          currencySymbol={currencySymbol}
          format="number"
        />
      </div>
    </section>
  );
}
