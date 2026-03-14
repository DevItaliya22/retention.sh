"use client";

import { useCreateCampaignDraft } from "@/hooks/campaigns/useCampaignsQuery";
import { useFeedbackOverviewQuery } from "@/hooks/feedback/useFeedbackConfig";
import {
  Button,
  Card,
  CardContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const RATING_EMOJI: Record<number, string> = {
  1: "😭",
  2: "😞",
  3: "😐",
  4: "😊",
  5: "😍",
};

const chartConfig = {
  count: { label: "Ratings", color: "var(--chart-1)" },
  percent: { label: "%", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function FeedbackRatingBreakdown() {
  const router = useRouter();
  const createDraft = useCreateCampaignDraft();
  const { data, isLoading } = useFeedbackOverviewQuery();
  const breakdown = data?.ratingBreakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = data?.totalFeedback ?? 0;

  const chartData = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    label: RATING_EMOJI[r],
    count: breakdown[r as 1 | 2 | 3 | 4 | 5] ?? 0,
    percent:
      total > 0
        ? Math.round(
            ((breakdown[r as 1 | 2 | 3 | 4 | 5] ?? 0) / total) * 1000,
          ) / 10
        : 0,
  }));

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="px-5 py-5">
        <h3 className="text-foreground font-semibold">Rating Breakdown</h3>
        <div className="mt-4 h-[220px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={36}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const payload = item?.payload as {
                        percent?: number;
                        count?: number;
                      };
                      return [
                        `${payload?.percent ?? 0}% · ${payload?.count ?? 0} Ratings`,
                        null,
                      ];
                    }}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-center text-xs">
          {chartData.map((d) => (
            <div key={d.rating} className="flex flex-col items-center gap-1">
              <span className="text-muted-foreground font-medium tabular-nums">
                {d.percent}%
              </span>
              <span className="text-muted-foreground">{d.count} Ratings</span>
              {d.count > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary h-auto px-1 py-0.5 text-[10px]"
                  disabled={createDraft.isPending}
                  onClick={async () => {
                    try {
                      const draft = await createDraft.mutateAsync();
                      router.push(
                        `/campaigns/create/${draft.id}?audience=feedback:rating_${d.rating}`,
                      );
                    } catch {
                      toast.error("Failed to create campaign draft");
                    }
                  }}
                >
                  <Megaphone className="mr-0.5 h-3 w-3" />
                  Campaign
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
