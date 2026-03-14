"use client";

import { useLoyaltyChartQuery } from "@/hooks/analytics/useAnalyticsQuery";
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const loyaltyChartConfig = {
  issued: { label: "Points Issued", color: "var(--chart-1)" },
  redeemed: { label: "Points Redeemed", color: "var(--chart-4)" },
} satisfies ChartConfig;

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface LoyaltyIssuedVsRedeemedChartProps {
  period: AnalyticsPeriod;
}

export function LoyaltyIssuedVsRedeemedChart({
  period,
}: LoyaltyIssuedVsRedeemedChartProps) {
  const { data, isLoading } = useLoyaltyChartQuery(period);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Points Issued vs Redeemed
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="relative h-[240px] w-full">
          <ChartContainer config={loyaltyChartConfig} className="h-full w-full">
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
                width={50}
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
                dataKey="issued"
                fill="var(--color-issued)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="redeemed"
                fill="var(--color-redeemed)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          {isLoading && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
