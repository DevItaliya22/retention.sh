"use client";

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

const ordersChartConfig = {
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

const inventoryChartConfig = {
  inbound: {
    label: "Inbound",
    color: "var(--chart-5)",
  },
  outbound: {
    label: "Outbound",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig;

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ordersTrend = weekDays.map((day, index) => ({
  day,
  thisWeek: [70, 78, 82, 90, 96, 84, 74][index],
  lastWeek: [60, 64, 68, 72, 80, 70, 61][index],
}));

const revenueTrend = weekDays.map((day, index) => ({
  day,
  thisWeek: [2800, 3200, 3500, 4000, 4500, 3900, 3440][index],
  lastWeek: [2500, 2700, 2900, 3200, 3600, 3100, 2470][index],
}));

const inventoryTrend = weekDays.map((day, index) => ({
  day,
  inbound: [160, 175, 190, 210, 220, 195, 160][index],
  outbound: [130, 135, 145, 160, 175, 170, 175][index],
}));

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
  data: any[];
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

export function WeeklyTrendsSection() {
  return (
    <section className="space-y-3">
      <SectionHeader title="This Week Overview" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,150px),minmax(0,1fr)]">
              <div className="space-y-3">
                <MetricRow
                  label="This week"
                  value={574}
                  colorClass="bg-[var(--chart-1)]"
                />
                <MetricRow
                  label="Last week"
                  value={455}
                  colorClass="bg-[var(--chart-3)]"
                />
              </div>
              <MiniLineChart
                data={ordersTrend}
                config={ordersChartConfig}
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
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,150px),minmax(0,1fr)]">
              <div className="space-y-3">
                <MetricRow
                  label="This week"
                  value="25,840"
                  colorClass="bg-[var(--chart-2)]"
                />
                <MetricRow
                  label="Last week"
                  value="20,470"
                  colorClass="bg-[var(--chart-4)]"
                />
              </div>
              <MiniLineChart
                data={revenueTrend}
                config={revenueChartConfig}
                primaryKey="thisWeek"
                secondaryKey="lastWeek"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,150px),minmax(0,1fr)]">
              <div className="space-y-3">
                <MetricRow
                  label="Inbound"
                  value="1,310"
                  colorClass="bg-[var(--chart-5)]"
                />
                <MetricRow
                  label="Outbound"
                  value="1,190"
                  colorClass="bg-[var(--chart-6)]"
                />
              </div>
              <MiniLineChart
                data={inventoryTrend}
                config={inventoryChartConfig}
                primaryKey="inbound"
                secondaryKey="outbound"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
