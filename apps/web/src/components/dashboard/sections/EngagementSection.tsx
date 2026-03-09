"use client";

import {
  useCampaignAnalyticsQuery,
  useFeedbackAnalyticsQuery,
  useReferralAnalyticsQuery,
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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { PeriodSelector, SectionHeader } from "../shared";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const feedbackChartConfig = {
  avgRating: { label: "Avg Rating", color: "var(--chart-2)" },
} satisfies ChartConfig;

function FeedbackWidget({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useFeedbackAnalyticsQuery(period);

  const stats = [
    { label: "Total Feedback", value: data?.total ?? 0 },
    { label: "Avg Rating", value: data?.averageRating?.toFixed(2) ?? "0" },
    {
      label: "Negative",
      value: `${data?.negativePercentage ?? 0}%`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-muted-foreground text-xs">{s.label}</p>
              <p className="text-lg font-semibold tabular-nums">
                {isLoading ? (
                  <Skeleton className="inline-block h-5 w-12" />
                ) : (
                  String(s.value)
                )}
              </p>
            </div>
          ))}
        </div>
        {isLoading || (data?.trend && data.trend.length > 1) ? (
          <div className="relative h-[160px] w-full">
            <ChartContainer
              config={feedbackChartConfig}
              className="h-full w-full"
            >
              <LineChart
                data={data?.trend ?? []}
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
                  width={30}
                  domain={[0, 5]}
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
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="var(--color-avgRating)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
            {isLoading && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-lg" />
            )}
          </div>
        ) : (
          <div className="flex h-[160px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Not enough feedback data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignWidget({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useCampaignAnalyticsQuery(period);

  const stats = [
    { label: "Total Sent", value: data?.totalSent ?? 0 },
    { label: "WhatsApp", value: data?.whatsappCount ?? 0 },
    { label: "Email", value: data?.emailCount ?? 0 },
    { label: "SMS", value: data?.smsCount ?? 0 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-muted-foreground text-xs">{s.label}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {isLoading ? (
                  <Skeleton className="inline-block h-7 w-12" />
                ) : (
                  s.value.toLocaleString()
                )}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralWidget({ period }: { period: AnalyticsPeriod }) {
  const { data, isLoading } = useReferralAnalyticsQuery(period);

  const stats = [
    { label: "Total Referred", value: data?.totalReferred ?? 0 },
    { label: "Converted", value: data?.converted ?? 0 },
    { label: "Conversion Rate", value: `${data?.conversionRate ?? 0}%` },
    {
      label: "Reward Points",
      value: (data?.totalRewardPoints ?? 0).toLocaleString(),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Referrals</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-muted-foreground text-xs">{s.label}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {isLoading ? (
                  <Skeleton className="inline-block h-7 w-12" />
                ) : (
                  String(s.value)
                )}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EngagementSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Engagement"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <FeedbackWidget period={period} />
        <CampaignWidget period={period} />
        <ReferralWidget period={period} />
      </div>
    </section>
  );
}
