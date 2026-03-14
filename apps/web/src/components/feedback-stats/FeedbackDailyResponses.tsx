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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  count: { label: "Responses", color: "hsl(199, 89%, 48%)" },
} satisfies ChartConfig;

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FeedbackDailyResponses() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useFeedbackAnalyticsQuery(period);
  const trend = data?.trend ?? [];

  const chartData = trend.map((t) => ({
    date: t.date,
    count: t.count,
  }));

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-foreground font-semibold">Daily responses</h3>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <div className="mt-4 h-[220px] w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
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
                  tickMargin={4}
                  width={36}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) =>
                        formatDateLabel(label as string)
                      }
                      formatter={(value) => [
                        `${value} response${Number(value) !== 1 ? "s" : ""}`,
                        null,
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="hsl(199, 89%, 48%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
