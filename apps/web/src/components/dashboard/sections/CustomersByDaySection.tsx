"use client";

import { useCustomersByDayQuery } from "@/hooks/analytics/useAnalyticsQuery";
import {
  Card,
  CardContent,
  CardHeader,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { CalendarDays } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { SectionHeader } from "../shared";

const chartConfig = {
  count: { label: "Customers", color: "var(--chart-1)" },
  weekdays: { label: "Mon-Fri", color: "var(--chart-1)" },
  weekends: { label: "Weekends", color: "var(--chart-3)" },
  both: { label: "Both", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function CustomersByDaySection() {
  const { data, isLoading, isError, error } = useCustomersByDayQuery();

  if (isError) {
    return (
      <section className="space-y-3">
        <SectionHeader title="Customers By Day" />
        <Card className="from-primary/10 dark:from-primary/15 overflow-hidden bg-gradient-to-t to-transparent">
          <CardContent className="text-destructive flex items-center justify-center py-12">
            {error?.message ?? "Failed to load"}
          </CardContent>
        </Card>
      </section>
    );
  }

  const total = data?.total ?? 0;
  const weekdays = data?.weekdays ?? 0;
  const weekends = data?.weekends ?? 0;
  const both = data?.both ?? 0;
  const topLabel = data?.topLabel ?? "—";

  const chartData = [
    { name: "Mon-Fri", count: weekdays, fill: "var(--chart-1)" },
    { name: "Weekends", count: weekends, fill: "var(--chart-3)" },
    { name: "Both", count: both, fill: "var(--chart-5)" },
  ];

  return (
    <section className="space-y-3">
      <SectionHeader title="Customers By Day" />
      <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <div className="text-muted-foreground bg-muted h-6 w-32 animate-pulse rounded" />
            ) : (
              <p className="text-foreground text-xl font-semibold tabular-nums">
                {topLabel}
              </p>
            )}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <CalendarDays className="size-3.5" />
            <span>Weekend vs weekday</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-[200px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={32}
                  allowDecimals={false}
                  tickFormatter={(v) => String(v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => [
                        `${value} ${Number(value) === 1 ? "customer" : "customers"}`,
                        null,
                      ]}
                    />
                  }
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
