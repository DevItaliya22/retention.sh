"use client";

import {
  useCampaignAnalyticsQuery,
  useFeedbackAnalyticsQuery,
  useReferralAnalyticsQuery,
} from "@/hooks/analytics/useAnalyticsQuery";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { useState } from "react";
import { PeriodSelector, SectionHeader } from "../shared";

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
    <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Feedback</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
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
    <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
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
    <Card className="from-primary/10 dark:from-primary/15 relative overflow-hidden bg-gradient-to-t to-transparent">
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
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
        <FeedbackWidget period={period} />
        <CampaignWidget period={period} />
        <ReferralWidget period={period} />
      </div>
    </section>
  );
}
