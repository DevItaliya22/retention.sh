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
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { PeriodSelector } from "../shared";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrencyCompact(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

export function RevenueSalesInteractiveBarSection() {
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("30d");
  const [activeMetric, setActiveMetric] =
    React.useState<keyof typeof chartConfig>("revenue");

  const { data, isLoading } = useRevenueChartQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const totals = React.useMemo(() => {
    const points = data?.data ?? [];
    return {
      revenue:
        data?.totalRevenue ?? points.reduce((acc, p) => acc + p.revenue, 0),
      orders: data?.totalOrders ?? points.reduce((acc, p) => acc + p.orders, 0),
    };
  }, [data]);

  const chartData = data?.data ?? [];

  return (
    <section className="space-y-3">
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-col items-stretch gap-0 p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-4 pt-4 pb-3 sm:py-0">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-foreground text-sm font-semibold tracking-tight">
                  Revenue & Sales
                </p>
                <p className="text-muted-foreground text-xs">
                  Showing revenue and orders for the last {period}
                </p>
              </div>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>
          </div>

          <div className="grid w-full grid-cols-2 sm:w-[360px]">
            {(["revenue", "orders"] as const).map((key) => {
              const metric = key as keyof typeof chartConfig;
              return (
                <button
                  key={metric}
                  data-active={activeMetric === metric}
                  className="data-[active=true]:bg-muted/50 relative z-30 flex w-full flex-col justify-center gap-1 border-t px-4 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-6"
                  onClick={() => setActiveMetric(metric)}
                  type="button"
                >
                  <span className="text-muted-foreground text-xs">
                    {chartConfig[metric].label}
                  </span>
                  <span className="text-lg leading-none font-bold tabular-nums sm:text-3xl">
                    {isLoading ? (
                      <Skeleton className="mt-1 h-7 w-28" />
                    ) : metric === "revenue" ? (
                      formatCurrencyCompact(totals.revenue, currencySymbol)
                    ) : (
                      totals.orders.toLocaleString()
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <div className="border-b" />

        <CardContent className="px-0 pt-2 pb-2 sm:pt-4 sm:pb-6">
          <div className="relative h-[280px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 6, right: 12, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={formatDateTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={60}
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (activeMetric === "revenue")
                      return formatCurrencyCompact(n, currencySymbol);
                    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
                    return `${n}`;
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[170px]"
                      labelFormatter={(value) => {
                        if (typeof value === "string")
                          return formatDateTick(value);
                        return String(value);
                      }}
                      formatter={(value) => {
                        const n = Number(value);
                        if (activeMetric === "revenue") {
                          return (
                            <div className="flex items-center justify-between gap-8">
                              <span className="text-muted-foreground text-xs">
                                Revenue
                              </span>
                              <span className="font-mono text-xs font-medium tabular-nums">
                                {currencySymbol}
                                {n.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-muted-foreground text-xs">
                              Orders
                            </span>
                            <span className="font-mono text-xs font-medium tabular-nums">
                              {n.toLocaleString()}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Line
                  dataKey={activeMetric}
                  type="monotone"
                  stroke={`var(--color-${activeMetric})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeLinecap="round"
                />
              </LineChart>
            </ChartContainer>

            {isLoading && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
