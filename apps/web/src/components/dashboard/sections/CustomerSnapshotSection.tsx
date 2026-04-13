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
  type ChartConfig,
} from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { PeriodSelector, SectionHeader } from "../shared";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const frequencyConfig = {
  visit1: { label: "1 visit", color: "var(--chart-1)" },
  visit2: { label: "2 visits", color: "var(--chart-2)" },
  visit3to5: { label: "3-5 visits", color: "var(--chart-3)" },
  visit6plus: { label: "6+ visits", color: "var(--chart-4)" },
  empty: { label: "", color: "var(--chart-5)" },
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
        <Card
          key={card.label}
          className="from-primary/10 dark:from-primary/15 relative gap-2 overflow-hidden bg-gradient-to-t to-transparent py-4"
        >
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
  const chartData = (data?.data ?? []).slice(-7).map((entry) => ({
    date: entry.date,
    total: (entry.new ?? 0) + (entry.repeat ?? 0),
  }));
  const maxValue = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="relative h-[260px] w-full">
      <div className="h-full w-full overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex h-full min-w-max items-end gap-3 px-4 pb-10">
          {chartData.map((bar) => {
            const normalized = bar.total / maxValue;
            const barHeight = Math.max(28, normalized * 180);

            return (
              <div
                key={bar.date}
                className="relative flex w-[56px] shrink-0 flex-col items-center justify-end"
              >
                <div
                  className="relative w-full overflow-hidden rounded-b-[6px] shadow-[0_12px_20px_-8px_rgba(92,77,255,0.45)]"
                  style={{
                    height: `${barHeight}px`,
                    borderTopLeftRadius: "999px",
                    borderTopRightRadius: "999px",
                    background:
                      "linear-gradient(180deg, #8B80FF 0%, #7568FF 62%, #5C4DFF 100%)",
                  }}
                >
                  <div
                    className="absolute top-3 left-1/2 h-3.5 w-[55%] -translate-x-1/2 rounded-full bg-white/75 blur-[1.8px]"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-muted-foreground absolute -bottom-8 text-center text-sm font-medium">
                  {formatDateLabel(bar.date)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
      )}
      {!isLoading && data && (
        <p className="text-muted-foreground px-4 pt-2 text-xs">
          {data.totalVisitors.toLocaleString()} total customers
        </p>
      )}
    </div>
  );
}

function FrequencyChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useCustomerFrequencyQuery(period);

  const hasData =
    data && Array.isArray(data.data) && data.data.some((d) => d.count > 0);

  const pieData = hasData
    ? data!.data
        .map((d) => {
          const key =
            d.bucket === "1 visit"
              ? "visit1"
              : d.bucket === "2 visits"
                ? "visit2"
                : d.bucket === "3-5 visits"
                  ? "visit3to5"
                  : d.bucket === "6+ visits"
                    ? "visit6plus"
                    : d.bucket;

          return {
            key,
            name: d.bucket,
            value: d.count,
            fill: `var(--color-${key})`,
          };
        })
        .filter((d) => typeof d.value === "number" && d.value > 0)
    : [
        {
          key: "empty",
          name: "No data yet",
          value: 1,
          fill: "var(--color-empty)",
        },
      ];

  return (
    <div className="relative h-[260px] w-full">
      <ChartContainer config={frequencyConfig} className="h-full w-full">
        <PieChart accessibilityLayer>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            labelLine={hasData}
            label={(props) => {
              const { cx, cy, midAngle, outerRadius, value, name } =
                props as unknown as {
                  cx: number;
                  cy: number;
                  midAngle: number;
                  outerRadius: number;
                  value: number;
                  name: string;
                };

              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 16;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              const textAnchor = x > cx ? "start" : "end";

              const display =
                hasData && name !== "No data yet"
                  ? `${name}: ${Number(value).toLocaleString()}`
                  : name;

              return (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                >
                  {display}
                </text>
              );
            }}
          >
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Pie>

          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize={24}
            fontWeight={700}
          >
            {(data?.totalVisitors ?? 0).toLocaleString()}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={12}
          >
            Customers
          </text>
        </PieChart>
      </ChartContainer>

      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
      )}
      {!isLoading && data && (
        <p className="text-muted-foreground px-4 pt-2 text-xs">
          {data.totalVisitors.toLocaleString()} total customers
        </p>
      )}
    </div>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Visit frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Visit freq per day
              </p>
              <NewVsRepeatChart period={period} />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Visit freq with customer relation
              </p>
              <FrequencyChart period={period} />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
