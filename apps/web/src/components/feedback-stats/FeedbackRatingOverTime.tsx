"use client";

import { PeriodSelector } from "@/components/dashboard/shared";
import { useFeedbackAnalyticsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import {
  Card,
  CardContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  avgRating: { label: "Avg. Rating", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FeedbackRatingOverTime() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useFeedbackAnalyticsQuery(period);
  const trend = data?.trend ?? [];

  const chartData = trend.map((t) => ({
    date: t.date,
    avgRating: t.avgRating,
    count: t.count,
  }));

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-foreground font-semibold">Ratings over time</h3>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <div className="mt-4 h-[240px] w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDateLabel}
                  interval="preserveStartEnd"
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 5]}
                  tickMargin={4}
                  width={32}
                  tickFormatter={(v) => String(Number(v).toFixed(1))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={formatDateLabel}
                      formatter={(value, _name, item) => {
                        const p = item?.payload as { count?: number };
                        return [
                          `Avg ${value} (${p?.count ?? 0} responses)`,
                          null,
                        ];
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="var(--color-avgRating)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
