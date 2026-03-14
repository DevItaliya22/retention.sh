"use client";

import { useReferralMonthlyQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type ChartConfig,
} from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { Info } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  rewardsCost: { label: "Rewards Spent", color: "var(--chart-4)" },
  referralRevenue: {
    label: "Revenue Earned",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

export function ReferralCostVsRevenueChart() {
  const { data, isLoading } = useReferralMonthlyQuery();
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Monthly Cost vs Revenue
        </CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            align="start"
            className="bg-popover text-popover-foreground w-64 rounded-lg border p-3 shadow-md"
          >
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--chart-4)" }}
                />
                <div>
                  <p className="text-xs font-medium">Rewards Spent</p>
                  <p className="text-muted-foreground text-[11px]">
                    Bonus cashback given to new referred customers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--chart-2)" }}
                />
                <div>
                  <p className="text-xs font-medium">Revenue Earned</p>
                  <p className="text-muted-foreground text-[11px]">
                    Revenue from referred customers&apos; bills
                  </p>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="relative h-[280px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
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
                width={60}
                tickFormatter={(v) =>
                  `${currencySymbol}${Number(v).toLocaleString("en-IN", { notation: "compact" })}`
                }
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
              <Line
                type="monotone"
                dataKey="rewardsCost"
                stroke="var(--color-rewardsCost)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="referralRevenue"
                stroke="var(--color-referralRevenue)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
          {isLoading && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: "var(--chart-4)" }}
            />
            <span className="text-muted-foreground text-xs">Rewards Spent</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            <span className="text-muted-foreground text-xs">
              Revenue Earned
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
