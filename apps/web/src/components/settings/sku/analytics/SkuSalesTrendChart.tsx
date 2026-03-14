"use client";

import { useSkuTrendQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
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
  itemsSold: { label: "Items Sold", color: "var(--chart-3)" },
} satisfies ChartConfig;

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function SkuSalesTrendChart() {
  const { data, isLoading } = useSkuTrendQuery();
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Monthly Sales Trend (Last 6 Months)
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
              />
              <YAxis
                yAxisId="revenue"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={60}
                tickFormatter={(v) =>
                  `${currencySymbol}${Number(v).toLocaleString("en-IN", { notation: "compact" })}`
                }
              />
              <YAxis
                yAxisId="items"
                orientation="right"
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
                        ? formatMonthLabel(label)
                        : String(label)
                    }
                    formatter={(value, name) => {
                      if (name === "revenue")
                        return `${currencySymbol}${Number(value).toLocaleString("en-IN")}`;
                      return Number(value).toLocaleString("en-IN");
                    }}
                  />
                }
              />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="items"
                dataKey="itemsSold"
                fill="var(--color-itemsSold)"
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
