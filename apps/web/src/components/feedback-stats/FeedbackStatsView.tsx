"use client";

import { FeedbackCategoryWiseRating } from "./FeedbackCategoryWiseRating";
import { FeedbackDailyResponses } from "./FeedbackDailyResponses";
import { FeedbackHowDidYouHearChart } from "./FeedbackHowDidYouHearChart";
import { FeedbackRatingBreakdown } from "./FeedbackRatingBreakdown";
import { FeedbackRatingOverTime } from "./FeedbackRatingOverTime";
import { FeedbackSelectionOptionsStats } from "./FeedbackSelectionOptionsStats";
import { FeedbackStatsCards } from "./FeedbackStatsCards";

export function FeedbackStatsView() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold">Overview</h2>
        <FeedbackStatsCards />
      </section>
      <section>
        <FeedbackRatingBreakdown />
      </section>
      <section>
        <FeedbackCategoryWiseRating />
      </section>
      <section>
        <FeedbackSelectionOptionsStats />
      </section>
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold">Trends</h2>
        <div className="space-y-6">
          <FeedbackRatingOverTime />
          <FeedbackDailyResponses />
        </div>
      </section>
      <section>
        <FeedbackHowDidYouHearChart />
      </section>
    </div>
  );
}
