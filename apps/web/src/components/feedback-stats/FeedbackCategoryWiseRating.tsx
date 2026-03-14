"use client";

import { useFeedbackCategoryWiseQuery } from "@/hooks/feedback/useFeedbackConfig";
import { Card, CardContent } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { FeedbackRatingRow } from "./FeedbackRatingRow";

export function FeedbackCategoryWiseRating() {
  const { data, isLoading } = useFeedbackCategoryWiseQuery();
  const categories = data?.categories ?? [];

  if (categories.length === 0 && !isLoading) return null;

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="border-border/60 bg-muted/30 border-b px-5 py-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Category
          </p>
          <p className="text-foreground mt-0.5 text-sm font-medium">
            Average rating and sentiment breakdown per category
          </p>
        </div>
        <div className="divide-border/50 divide-y p-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
              ))
            : categories.map((cat) => (
                <FeedbackRatingRow
                  key={cat.name}
                  label={cat.name}
                  avgRating={cat.avgRating}
                  positive={cat.positive}
                  neutral={cat.neutral}
                  negative={cat.negative}
                />
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
