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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
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
  visit1: { label: "1 visit", color: "var(--chart-1)" },
  visit2: { label: "2 visits", color: "var(--chart-2)" },
  visit3to5: { label: "3-5 visits", color: "var(--chart-3)" },
  visit6plus: { label: "6+ visits", color: "var(--chart-4)" },
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
  const chartData = data?.data ?? [];
  const barLabelByKey: Record<string, string> = {
    new: barChartConfig.new.label,
    repeat: barChartConfig.repeat.label,
  };

  return (
    <div className="relative h-[260px] w-full">
      <ChartContainer config={barChartConfig} className="h-full w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 18, right: 12, left: 0, bottom: 0 }}
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
            allowDecimals={false}
            tickFormatter={(value) => Math.round(value as number).toString()}
          />
          <Bar dataKey="new" stackId="a" fill="var(--color-new)">
            {chartData.map((d, i) => {
              const hasNew = (d.new ?? 0) > 0;
              const hasRepeat = (d.repeat ?? 0) > 0;
              const radius: [number, number, number, number] = !hasNew
                ? [0, 0, 0, 0]
                : hasRepeat
                  ? [0, 0, 4, 4] // bottom segment
                  : [4, 4, 4, 4]; // only segment

              return (
                <Cell
                  key={`new-${d.date}-${i}`}
                  radius={radius as unknown as number}
                />
              );
            })}
          </Bar>
          <Bar dataKey="repeat" stackId="a" fill="var(--color-repeat)">
            {chartData.map((d, i) => {
              const hasNew = (d.new ?? 0) > 0;
              const hasRepeat = (d.repeat ?? 0) > 0;
              const radius: [number, number, number, number] = !hasRepeat
                ? [0, 0, 0, 0]
                : hasNew
                  ? [4, 4, 0, 0] // top segment
                  : [4, 4, 4, 4]; // only segment

              return (
                <Cell
                  key={`repeat-${d.date}-${i}`}
                  radius={radius as unknown as number}
                />
              );
            })}
            <LabelList
              dataKey="repeat"
              position="top"
              content={(props) => {
                const { x, y, width, index } = props;
                const p = typeof index === "number" ? chartData[index] : null;
                if (!p) return null;
                const total = (p.new ?? 0) + (p.repeat ?? 0);
                if (total <= 0) return null;
                const cx = Number(x ?? 0) + Number(width ?? 0) / 2;
                const cy = Number(y ?? 0) - 6;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={12}
                  >
                    {total.toLocaleString()}
                  </text>
                );
              }}
            />
          </Bar>
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(label) =>
                  typeof label === "string"
                    ? formatDateLabel(label)
                    : String(label)
                }
                formatter={(value, name, item) => {
                  const formatted =
                    typeof value === "number"
                      ? Math.round(value).toLocaleString()
                      : String(value);
                  const label =
                    typeof name === "string"
                      ? (barLabelByKey[name] ?? name)
                      : String(name);
                  const indicatorColor =
                    (item as any)?.payload?.fill || (item as any)?.color;

                  return (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: indicatorColor }}
                      />
                      <div className="flex flex-1 items-center justify-between leading-none">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formatted}
                        </span>
                      </div>
                    </>
                  );
                }}
              />
            }
            cursor={false}
            defaultIndex={1}
          />
        </BarChart>
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

function FrequencyChart({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useCustomerFrequencyQuery(period);

  const pieData =
    data?.data
      ?.map((d) => {
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
      .filter((d) => typeof d.value === "number" && d.value > 0) ?? [];

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
            labelLine
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

              return (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill="hsl(var(--foreground))"
                  fontSize={12}
                >
                  {`${name}: ${Number(value).toLocaleString()}`}
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
            fontSize={28}
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
