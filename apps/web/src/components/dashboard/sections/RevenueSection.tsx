"use client";

import { useRevenueChartQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import {
  Card,
  CardContent,
  CardHeader,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PeriodSelector } from "../shared";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  aov: {
    label: "Avg Order Value",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatCurrency(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPeriodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case "7d":
      return "7 days";
    case "30d":
      return "30 days";
    case "90d":
      return "3 months";
    case "12mo":
      return "12 months";
  }
}

export function RevenueSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useRevenueChartQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  return (
    <section className="space-y-3">
      <Card>
        <CardHeader className="gap-4 pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:justify-between">
            <div className="space-y-1">
              <p className="text-foreground text-sm font-semibold tracking-tight">
                Revenue & Sales
              </p>
              <p className="text-muted-foreground text-xs">
                Showing revenue and orders for the last{" "}
                {formatPeriodLabel(period)}
              </p>
            </div>

            <div className="flex items-stretch justify-between gap-4 md:justify-end">
              <div className="bg-border hidden w-px md:block" />
              <div className="divide-border bg-muted/20 grid grid-cols-2 divide-x overflow-hidden rounded-md border">
                <div className="px-4 py-2 text-right">
                  <p className="text-muted-foreground text-xs">Revenue</p>
                  <div className="text-foreground mt-1 text-xl font-semibold tabular-nums">
                    {isLoading ? (
                      <Skeleton className="ml-auto inline-block h-6 w-24" />
                    ) : (
                      formatCurrency(data?.totalRevenue ?? 0, currencySymbol)
                    )}
                  </div>
                </div>
                <div className="px-4 py-2 text-right">
                  <p className="text-muted-foreground text-xs">Orders</p>
                  <div className="text-foreground mt-1 text-xl font-semibold tabular-nums">
                    {isLoading ? (
                      <Skeleton className="ml-auto inline-block h-6 w-16" />
                    ) : (
                      (data?.totalOrders ?? 0).toLocaleString()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-muted-foreground text-xs">
              Avg order value:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {isLoading ? (
                  <Skeleton className="ml-1 inline-block h-4 w-16 align-middle" />
                ) : (
                  `${currencySymbol}${(data?.averageOrderValue ?? 0).toFixed(2)}`
                )}
              </span>
            </p>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart
                data={data?.data ?? []}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDateLabel}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={60}
                  tickFormatter={(v) =>
                    formatCurrency(v as number, currencySymbol)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => {
                        if (typeof label === "string")
                          return formatDateLabel(label);
                        return String(label);
                      }}
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-muted-foreground text-xs">
                            {name === "revenue" ? "Revenue" : "AOV"}
                          </span>
                          <span className="font-mono text-xs font-medium">
                            {currencySymbol}
                            {Number(value).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#fillRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
