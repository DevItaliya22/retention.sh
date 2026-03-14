"use client";

import { useFeedbackHowDidYouHearQuery } from "@/hooks/feedback/useFeedbackConfig";
import {
  Card,
  CardContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@reelo/ui/components";
import { Cell, Pie, PieChart } from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function buildConfig(options: { name: string }[]): ChartConfig {
  const config: ChartConfig = {};
  options.forEach((opt, i) => {
    config[opt.name.replace(/\s/g, "")] = {
      label: opt.name,
      color: COLORS[i % COLORS.length],
    };
  });
  return config;
}

export function FeedbackHowDidYouHearChart() {
  const { data } = useFeedbackHowDidYouHearQuery();

  if (!data?.enabled || !data.options.length) return null;

  const chartData = data.options
    .filter((o) => o.count > 0)
    .map((o) => ({ name: o.name, value: o.percent, count: o.count }));
  const config = buildConfig(data.options);

  if (chartData.length === 0) return null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="px-5 py-5">
        <h3 className="text-foreground font-semibold">
          How did you hear about us?
        </h3>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-[200px] w-full min-w-[200px] sm:w-[200px]">
            <ChartContainer config={config} className="h-full w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => {
                        const p = item?.payload as { count?: number };
                        return [`${value}% (${p?.count ?? 0})`, null];
                      }}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
            {data.options.map((opt, i) => (
              <div key={opt.name} className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
                <span className="text-muted-foreground text-sm">
                  {opt.name}:{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {opt.percent}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
