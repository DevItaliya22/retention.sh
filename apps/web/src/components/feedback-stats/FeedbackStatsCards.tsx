"use client";

import { useFeedbackOverviewQuery } from "@/hooks/feedback/useFeedbackConfig";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { MessageSquare, Star, ThumbsUp } from "lucide-react";

export function FeedbackStatsCards() {
  const { data: overview, isLoading: overviewLoading } =
    useFeedbackOverviewQuery();

  const total = overview?.totalFeedback ?? 0;
  const avgRating = overview?.averageRating ?? 0;
  const positiveCount = overview?.positiveCount ?? 0;
  const negativeCount = overview?.negativeCount ?? 0;
  const neutralCount = overview?.neutralCount ?? 0;
  const positivePercent = overview?.positivePercent ?? 0;
  const negativePercent = overview?.negativePercent ?? 0;
  const neutralPercent = overview?.neutralPercent ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Total Feedback
              </p>
              {overviewLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {total.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-2.5">
              <MessageSquare className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Reelo assisted
              </p>
              {overviewLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 text-3xl font-bold tracking-tight tabular-nums">
                  {total.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-2.5">
              <ThumbsUp className="size-5" strokeWidth={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
                Avg. Rating
              </p>
              {overviewLoading ? (
                <Skeleton className="mt-2 h-9 w-24" />
              ) : (
                <p className="text-foreground mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight tabular-nums">
                  {avgRating.toFixed(1)}
                  <span className="text-muted-foreground text-lg font-normal">
                    / 5
                  </span>
                </p>
              )}
            </div>
            <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400">
              <Star className="size-5" strokeWidth={2} fill="currentColor" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 col-span-1 overflow-hidden shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
        <CardContent className="px-6 py-5">
          <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wider uppercase">
            Feedback Report
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-r-lg border-l-4 border-emerald-500 bg-emerald-500/5 px-3 py-2.5 dark:bg-emerald-500/10">
              <span className="text-2xl" aria-hidden>
                😊
              </span>
              {overviewLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-foreground mt-1 text-lg font-bold tabular-nums">
                  {positivePercent}%
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                {positiveCount} positive
              </p>
            </div>
            <div className="rounded-r-lg border-l-4 border-rose-500 bg-rose-500/5 px-3 py-2.5 dark:bg-rose-500/10">
              <span className="text-2xl" aria-hidden>
                😞
              </span>
              {overviewLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-foreground mt-1 text-lg font-bold tabular-nums">
                  {negativePercent}%
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                {negativeCount} negative
              </p>
            </div>
            <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-500/5 px-3 py-2.5 dark:bg-amber-500/10">
              <span className="text-2xl" aria-hidden>
                😐
              </span>
              {overviewLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-foreground mt-1 text-lg font-bold tabular-nums">
                  {neutralPercent}%
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                {neutralCount} neutral
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
