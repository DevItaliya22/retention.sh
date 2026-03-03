"use client";

import { useInsightsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { BarChart3, ShoppingCart, Users } from "lucide-react";
import { SectionHeader } from "../shared";

export function InsightsSection() {
  const { data, isLoading } = useInsightsQuery();
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  return (
    <section className="space-y-3">
      <SectionHeader title="Top Insights" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 gap-3 py-5">
          <CardContent className="flex items-start gap-3 px-4">
            <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Users className="text-primary size-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Revenue Distribution
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-48" />
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  <span className="text-foreground font-semibold">
                    {data?.revenuePareto.customerPercentage ?? 0}%
                  </span>{" "}
                  of your customers contribute{" "}
                  <span className="text-foreground font-semibold">
                    {data?.revenuePareto.revenuePercentage ?? 0}%
                  </span>{" "}
                  of total revenue
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardContent className="flex items-start gap-3 px-4">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <ShoppingCart className="text-muted-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Average Order Value
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-32" />
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  Your average order value is{" "}
                  <span className="text-foreground font-semibold">
                    {currencySymbol}
                    {(data?.averageOrderValue ?? 0).toFixed(2)}
                  </span>{" "}
                  till today.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardContent className="flex items-start gap-3 px-4">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
              <BarChart3 className="text-muted-foreground size-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">
                Visit Frequency
              </p>
              {isLoading ? (
                <Skeleton className="mt-1 h-4 w-40" />
              ) : (
                <p className="text-muted-foreground mt-1 text-sm">
                  On avg, your customers visit{" "}
                  <span className="text-foreground font-semibold">
                    {data?.avgVisitsPerYear ?? 0}
                  </span>{" "}
                  times a year.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
