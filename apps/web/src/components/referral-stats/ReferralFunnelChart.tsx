"use client";

import { useReferralMonthlyQuery } from "@/hooks/analytics/useAnalyticsQuery";
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

const chartConfig = {
  totalReferrals: { label: "Total Referrals", color: "var(--chart-1)" },
  converted: { label: "Converted", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function ReferralFunnelChart() {
  const { data, isLoading } = useReferralMonthlyQuery();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Monthly Referrals vs Converted
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="relative h-[280px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={data?.data ?? []}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatMonthLabel}
                interval={0}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={40}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-40 px-3.5 py-2"
                    labelFormatter={(label) =>
                      typeof label === "string"
                        ? formatMonthLabel(label)
                        : String(label)
                    }
                  />
                }
              />
              <Bar
                dataKey="totalReferrals"
                fill="var(--color-totalReferrals)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="converted"
                fill="var(--color-converted)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          {isLoading && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            <span className="text-muted-foreground text-xs">
              Total Referrals
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            <span className="text-muted-foreground text-xs">Converted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
