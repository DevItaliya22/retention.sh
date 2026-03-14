"use client";

import { useSkuOverviewQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { Boxes, DollarSign, Hash, ShoppingCart } from "lucide-react";

interface SkuStatsCardsProps {
  period?: AnalyticsPeriod;
}

export function SkuStatsCards({ period = "30d" }: SkuStatsCardsProps) {
  const { data, isLoading } = useSkuOverviewQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const cards = [
    {
      label: "Items Sold",
      value: (data?.itemsSold ?? 0).toLocaleString("en-IN"),
      icon: ShoppingCart,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Item Revenue",
      value: `${currencySymbol}${(data?.itemRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      iconClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Unique SKUs Sold",
      value: (data?.uniqueSkusSold ?? 0).toLocaleString("en-IN"),
      icon: Boxes,
      iconClassName: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Avg Items / Bill",
      value: (data?.avgItemsPerBill ?? 0).toFixed(1),
      icon: Hash,
      iconClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
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
  );
}
