"use client";

import { useLoyaltyOverviewQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { Coins, DollarSign, Gift, Percent } from "lucide-react";

interface LoyaltyStatsCardsProps {
  period?: AnalyticsPeriod;
}

export function LoyaltyStatsCards({ period = "30d" }: LoyaltyStatsCardsProps) {
  const { data, isLoading } = useLoyaltyOverviewQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const redemptionRate = data?.redemptionRate ?? 0;
  const totalIssued = data?.totalPointsIssued ?? 0;
  const totalRedeemed = data?.totalPointsRedeemed ?? 0;
  const avgRevenue = data?.avgRevenuePerRedemption ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Redemption rate
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {redemptionRate}%
                </p>
              )}
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-2.5">
              <Percent className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Points issued
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {totalIssued.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-2.5">
              <Gift className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Points redeemed
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {totalRedeemed.toLocaleString()}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400">
              <Coins className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Avg revenue / redemption
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {currencySymbol}
                  {avgRevenue.toFixed(2)}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
