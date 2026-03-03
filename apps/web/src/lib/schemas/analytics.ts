import { z } from "zod";

export const analyticsPeriods = ["7d", "30d", "90d", "12mo"] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

export const analyticsQuerySchema = z.object({
  period: z.enum(analyticsPeriods).default("30d").optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

export function getPeriodDateRange(period: AnalyticsPeriod = "30d"): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "90d":
      from.setDate(from.getDate() - 90);
      break;
    case "12mo":
      from.setMonth(from.getMonth() - 12);
      break;
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 59, 59, 999);
  return d;
}
