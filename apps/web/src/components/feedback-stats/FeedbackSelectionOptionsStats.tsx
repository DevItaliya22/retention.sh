"use client";

import { useFeedbackSelectionOptionsStatsQuery } from "@/hooks/feedback/useFeedbackConfig";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { FeedbackRatingRow } from "./FeedbackRatingRow";

export function FeedbackSelectionOptionsStats() {
  const { data, isLoading } = useFeedbackSelectionOptionsStatsQuery();
  const options = data?.options ?? [];

  if (options.length === 0 && !isLoading) return null;

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="border-border/60 bg-muted/30 border-b px-5 py-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Selection options
          </p>
          <p className="text-foreground mt-0.5 text-sm font-medium">
            Average rating and sentiment for each option
          </p>
        </div>
        <div className="divide-border/50 divide-y p-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
              ))
            : options.map((opt) => (
                <FeedbackRatingRow
                  key={opt.id}
                  label={opt.label}
                  avgRating={opt.avgRating}
                  positive={opt.positive}
                  neutral={opt.neutral}
                  negative={opt.negative}
                />
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
