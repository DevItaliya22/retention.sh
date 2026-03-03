"use client";

import {
  useCustomerFrequencyQuery,
  useCustomerSnapshotQuery,
  useNewVsRepeatQuery,
} from "@/hooks/analytics/useAnalyticsQuery";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
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
import { Skeleton } from "@reelo/ui/components/skeleton";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PeriodSelector, SectionHeader } from "../shared";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const barChartConfig = {
  new: { label: "New", color: "var(--chart-7)" },
  repeat: { label: "Returning", color: "var(--chart-9)" },
} satisfies ChartConfig;

const frequencyConfig = {
  count: { label: "Customers", color: "var(--chart-1)" },
} satisfies ChartConfig;

function SnapshotCards({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useCustomerSnapshotQuery(period);

  const cards = [
    { label: "Total Customers", value: data?.totalCustomers },
    { label: "New in Period", value: data?.newInPeriod },
    { label: "Repeat in Period", value: data?.repeatInPeriod },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium">
              {card.label}
            </p>
            <div className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
              {isLoading ? (
                <Skeleton className="inline-block h-7 w-20" />
              ) : (
                (card.value ?? 0).toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NewVsRepeatChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useNewVsRepeatQuery(period);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          New vs Repeat Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {isLoading ? (
          <Skeleton className="h-[240px] w-full rounded-lg" />
        ) : (
          <ChartContainer config={barChartConfig} className="h-[240px] w-full">
            <BarChart
              data={data?.data ?? []}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
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
                width={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      typeof label === "string"
                        ? formatDateLabel(label)
                        : String(label)
                    }
                  />
                }
              />
              <Bar
                dataKey="new"
                stackId="a"
                fill={barChartConfig.new.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="repeat"
                stackId="a"
                fill={barChartConfig.repeat.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function FrequencyChart() {
  const { data, isLoading } = useCustomerFrequencyQuery();

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Visit Frequency</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full rounded-lg" />
        ) : (
          <ChartContainer config={frequencyConfig} className="h-[200px] w-full">
            <BarChart
              data={data?.data ?? []}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(value) =>
                  Math.round(value as number).toString()
                }
              />
              <YAxis
                dataKey="bucket"
                type="category"
                tickLine={false}
                axisLine={false}
                width={80}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
        {!isLoading && data && (
          <p className="text-muted-foreground px-4 pb-2 text-xs">
            {data.totalVisitors.toLocaleString()} total visitors
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerSnapshotSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Customer Snapshot"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <SnapshotCards period={period} />
      <NewVsRepeatChart period={period} />
      <FrequencyChart />
    </section>
  );
}
