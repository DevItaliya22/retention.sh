"use client";

import { useWeeklyTrendsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { SectionHeader } from "../shared";

const visitsChartConfig = {
  thisWeek: {
    label: "This week",
    color: "var(--chart-1)",
  },
  lastWeek: {
    label: "Last week",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  thisWeek: {
    label: "This week",
    color: "var(--chart-2)",
  },
  lastWeek: {
    label: "Last week",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const messagesChartConfig = {
  thisWeek: {
    label: "This week",
    color: "var(--chart-5)",
  },
  lastWeek: {
    label: "Last week",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig;

function MetricRow(props: {
  label: string;
  value: string | number;
  colorClass: string;
}) {
  const { label, value, colorClass } = props;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className={`h-8 w-1.5 rounded-full ${colorClass}`}
          aria-hidden="true"
        />
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {label}
          </span>
          <span className="text-foreground text-xl font-semibold tabular-nums">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniLineChart(props: {
  data: { day: string; thisWeek: number; lastWeek: number }[];
  config: ChartConfig;
  primaryKey: string;
  secondaryKey: string;
}) {
  const { data, config, primaryKey, secondaryKey } = props;

  return (
    <div className="h-24 w-full sm:h-28">
      <ChartContainer config={config} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ top: 4, right: 8, left: 12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => String(v).charAt(0)}
          />
          <YAxis hide />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(label) => String(label)}
              />
            }
          />
          <Line
            type="monotone"
            dataKey={primaryKey}
            stroke={`var(--color-${primaryKey})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey={secondaryKey}
            stroke={`var(--color-${secondaryKey})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function formatRevenue(value: number): string {
  if (value >= 1_00_000) {
    return `${(value / 1_00_000).toFixed(1)}L`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return Math.round(value).toLocaleString();
}

export function WeeklyTrendsSection() {
  const { data, isLoading, isError, error } = useWeeklyTrendsQuery();

  if (isError) {
    return (
      <section className="space-y-3">
        <SectionHeader title="This Week Overview" />
        <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-4 py-6 text-center">
          {error?.message ?? "Failed to load weekly trends"}
        </div>
      </section>
    );
  }

  const visitsData = data?.visits.data ?? [];
  const messagesData = data?.messages.data ?? [];
  const revenueData = data?.revenue.data ?? [];

  const visitsThisTotal = data?.visits.thisWeekTotal ?? 0;
  const visitsLastTotal = data?.visits.lastWeekTotal ?? 0;
  const messagesThisTotal = data?.messages.thisWeekTotal ?? 0;
  const messagesLastTotal = data?.messages.lastWeekTotal ?? 0;
  const revenueThisTotal = data?.revenue.thisWeekTotal ?? 0;
  const revenueLastTotal = data?.revenue.lastWeekTotal ?? 0;

  const skeletonData = [
    { day: "Mon", thisWeek: 0, lastWeek: 0 },
    { day: "Tue", thisWeek: 0, lastWeek: 0 },
    { day: "Wed", thisWeek: 0, lastWeek: 0 },
    { day: "Thu", thisWeek: 0, lastWeek: 0 },
    { day: "Fri", thisWeek: 0, lastWeek: 0 },
    { day: "Sat", thisWeek: 0, lastWeek: 0 },
    { day: "Sun", thisWeek: 0, lastWeek: 0 },
  ];

  const chartData = visitsData.length === 7 ? visitsData : skeletonData;
  const messagesChartData =
    messagesData.length === 7 ? messagesData : skeletonData;
  const revenueChartData =
    revenueData.length === 7 ? revenueData : skeletonData;

  return (
    <section className="space-y-3">
      <SectionHeader title="This Week Overview" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visits</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col justify-center gap-3">
                <MetricRow
                  label="This week"
                  value={isLoading ? "—" : visitsThisTotal}
                  colorClass="bg-[var(--chart-1)]"
                />
                <MetricRow
                  label="Last week"
                  value={isLoading ? "—" : visitsLastTotal}
                  colorClass="bg-[var(--chart-3)]"
                />
              </div>
              <MiniLineChart
                data={chartData}
                config={visitsChartConfig}
                primaryKey="thisWeek"
                secondaryKey="lastWeek"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col justify-center gap-3">
                <MetricRow
                  label="This week"
                  value={isLoading ? "—" : messagesThisTotal}
                  colorClass="bg-[var(--chart-5)]"
                />
                <MetricRow
                  label="Last week"
                  value={isLoading ? "—" : messagesLastTotal}
                  colorClass="bg-[var(--chart-6)]"
                />
              </div>
              <MiniLineChart
                data={messagesChartData}
                config={messagesChartConfig}
                primaryKey="thisWeek"
                secondaryKey="lastWeek"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col justify-center gap-3">
                <MetricRow
                  label="This week"
                  value={isLoading ? "—" : formatRevenue(revenueThisTotal)}
                  colorClass="bg-[var(--chart-2)]"
                />
                <MetricRow
                  label="Last week"
                  value={isLoading ? "—" : formatRevenue(revenueLastTotal)}
                  colorClass="bg-[var(--chart-4)]"
                />
              </div>
              <MiniLineChart
                data={revenueChartData}
                config={revenueChartConfig}
                primaryKey="thisWeek"
                secondaryKey="lastWeek"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
