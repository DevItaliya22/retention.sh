"use client";

import {
  useLoyaltyChartQuery,
  useLoyaltyOverviewQuery,
} from "@/hooks/analytics/useAnalyticsQuery";
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
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PeriodSelector, SectionHeader } from "../shared";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const loyaltyChartConfig = {
  issued: { label: "Points Issued", color: "var(--chart-1)" },
  redeemed: { label: "Points Redeemed", color: "var(--chart-4)" },
} satisfies ChartConfig;

// const rewardsConfig = {
//   count: { label: "Times Redeemed", color: "var(--chart-3)" },
// } satisfies ChartConfig;

function LoyaltyKpiCards({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useLoyaltyOverviewQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const kpis = [
    { label: "Redemption Rate", value: `${data?.redemptionRate ?? 0}%` },
    {
      label: "Points Issued",
      value: (data?.totalPointsIssued ?? 0).toLocaleString(),
    },
    {
      label: "Points Redeemed",
      value: (data?.totalPointsRedeemed ?? 0).toLocaleString(),
    },
    {
      label: "Avg Revenue / Redemption",
      value: `${currencySymbol}${(data?.avgRevenuePerRedemption ?? 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="from-primary/10 dark:from-primary/15 relative gap-2 overflow-hidden bg-gradient-to-t to-transparent py-4"
        >
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium">
              {kpi.label}
            </p>
            <div className="text-foreground mt-1 text-xl font-semibold tabular-nums">
              {isLoading ? (
                <Skeleton className="inline-block h-6 w-20" />
              ) : (
                kpi.value
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IssuedVsRedeemedChart({ period }: { period: AnalyticsPeriod }) {
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

// function TopRewardsChart({ period }: { period: AnalyticsPeriod }) {
//   const { data, isLoading } = useTopRewardsQuery(period);
//
//   return (
//     <Card>
//       <CardHeader className="pb-2">
//         <CardTitle className="text-sm font-medium">
//           Top Redeemed Rewards
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="px-2 pb-2">
//         {isLoading ? (
//           <Skeleton className="h-[200px] w-full rounded-lg" />
//         ) : data?.data && data.data.length > 0 ? (
//           <ChartContainer config={rewardsConfig} className="h-[200px] w-full">
//             <BarChart
//               data={data.data}
//               layout="vertical"
//               margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
//             >
//               <CartesianGrid horizontal={false} strokeDasharray="3 3" />
//               <XAxis type="number" tickLine={false} axisLine={false} />
//               <YAxis
//                 dataKey="name"
//                 type="category"
//                 tickLine={false}
//                 axisLine={false}
//                 width={140}
//                 className="text-xs"
//                 tickFormatter={(v) =>
//                   v.length > 22 ? v.slice(0, 22) + "..." : v
//                 }
//               />
//               <ChartTooltip content={<ChartTooltipContent />} />
//               <Bar
//                 dataKey="count"
//                 fill="var(--color-count)"
//                 radius={[0, 4, 4, 0]}
//               />
//             </BarChart>
//           </ChartContainer>
//         ) : (
//           <div className="flex h-[200px] items-center justify-center">
//             <p className="text-muted-foreground text-sm">
//               No rewards redeemed yet
//             </p>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

export function LoyaltyPerformanceSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Loyalty Performance"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <LoyaltyKpiCards period={period} />
      <IssuedVsRedeemedChart period={period} />
      {/* <TopRewardsChart period={period} /> */}
    </section>
  );
}
