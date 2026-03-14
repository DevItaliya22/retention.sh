"use client";

import { useSkuCategoryBreakdownQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
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

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface CategoryRevenueChartProps {
  period?: AnalyticsPeriod;
}

export function CategoryRevenueChart({
  period = "30d",
}: CategoryRevenueChartProps) {
  const { data, isLoading } = useSkuCategoryBreakdownQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";
  const categories = data?.categories ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Revenue by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <div className="relative h-[280px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) =>
                  `${currencySymbol}${Number(v).toLocaleString("en-IN", { notation: "compact" })}`
                }
              />
              <YAxis
                dataKey="categoryName"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={110}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const share = item?.payload?.revenueShare ?? 0;
                      return `${currencySymbol}${Number(value).toLocaleString("en-IN")} (${share}%)`;
                    }}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[0, 4, 4, 0]}
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
