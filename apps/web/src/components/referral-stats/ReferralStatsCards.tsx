"use client";

import { useReferralOverviewQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import {
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Lock,
  Percent,
  ShoppingBag,
  Unlock,
  Users,
} from "lucide-react";

interface ReferralStatsCardsProps {
  period?: AnalyticsPeriod;
}

export function ReferralStatsCards({
  period = "30d",
}: ReferralStatsCardsProps) {
  const { data, isLoading } = useReferralOverviewQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const primaryCards = [
    {
      label: "Total Referrals",
      value: (data?.totalReferrals ?? 0).toLocaleString("en-IN"),
      icon: Users,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Conversion Rate",
      value: `${data?.conversionRate ?? 0}%`,
      icon: Percent,
      iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Rewards Cost",
      value: `${currencySymbol}${(data?.rewardsCost ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: ArrowRightLeft,
      iconClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    {
      label: "Referral Revenue",
      value: `${currencySymbol}${(data?.referralRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
  ];

  const secondaryCards = [
    {
      label: "Avg Days to First Visit",
      value:
        data?.avgDaysToFirstVisit != null
          ? `${data.avgDaysToFirstVisit} days`
          : "—",
      icon: Calendar,
      iconClassName: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Rewards Locked",
      value: `${currencySymbol}${(data?.rewardsLocked ?? 0).toLocaleString("en-IN")}`,
      icon: Lock,
      iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Rewards Unlocked",
      value: `${currencySymbol}${(data?.rewardsUnlocked ?? 0).toLocaleString("en-IN")}`,
      icon: Unlock,
      iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Avg Referred Spend",
      value: `${currencySymbol}${(data?.avgReferredCustomerSpend ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: ShoppingBag,
      iconClassName: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryCards.map((card) => (
          <Card
            key={card.label}
            className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                    {card.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-9 w-24" />
                  ) : (
                    <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                      {card.value}
                    </p>
                  )}
                </div>
                <div className={`rounded-xl p-2.5 ${card.iconClassName}`}>
                  <card.icon className="size-5" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map((card) => (
          <Card
            key={card.label}
            className="border-border/80 overflow-hidden shadow-sm"
          >
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.iconClassName}`}>
                  <card.icon className="size-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">
                    {card.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-6 w-16" />
                  ) : (
                    <p className="text-foreground text-lg font-semibold tabular-nums">
                      {card.value}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
