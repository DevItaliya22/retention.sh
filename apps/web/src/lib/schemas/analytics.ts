import { z } from "zod";

export const analyticsPeriods = ["7d", "30d", "90d", "12mo"] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

export const analyticsQuerySchema = z.object({
  period: z.enum(analyticsPeriods).default("30d").optional(),
  tzOffsetMinutes: z.coerce.number().int().min(-840).max(840).optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

function toLocalShiftedDate(date: Date, tzOffsetMinutes: number): Date {
  return new Date(date.getTime() - tzOffsetMinutes * MS_PER_MINUTE);
}

function toUtcFromLocalShiftedDate(date: Date, tzOffsetMinutes: number): Date {
  return new Date(date.getTime() + tzOffsetMinutes * MS_PER_MINUTE);
}

function startOfDayUtcInOffset(date: Date, tzOffsetMinutes: number): Date {
  const local = toLocalShiftedDate(date, tzOffsetMinutes);
  local.setUTCHours(0, 0, 0, 0);
  return toUtcFromLocalShiftedDate(local, tzOffsetMinutes);
}

function endOfDayUtcInOffset(date: Date, tzOffsetMinutes: number): Date {
  const local = toLocalShiftedDate(date, tzOffsetMinutes);
  local.setUTCHours(23, 59, 59, 999);
  return toUtcFromLocalShiftedDate(local, tzOffsetMinutes);
}

export function getPeriodDateRange(
  period: AnalyticsPeriod = "30d",
  tzOffsetMinutes = 0,
): {
  from: Date;
  to: Date;
} {
  const now = new Date();
  const to = endOfDayUtcInOffset(now, tzOffsetMinutes);
  const from = startOfDayUtcInOffset(now, tzOffsetMinutes);

  switch (period) {
    case "7d":
      from.setUTCDate(from.getUTCDate() - 7);
      break;
    case "30d":
      from.setUTCDate(from.getUTCDate() - 30);
      break;
    case "90d":
      from.setUTCDate(from.getUTCDate() - 90);
      break;
    case "12mo":
      from.setUTCMonth(from.getUTCMonth() - 12);
      break;
  }

  return { from, to };
}

export function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfTodayInOffset(tzOffsetMinutes = 0): Date {
  return startOfDayUtcInOffset(new Date(), tzOffsetMinutes);
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

export function formatDateKeyInOffset(date: Date, tzOffsetMinutes = 0): string {
  const local = toLocalShiftedDate(date, tzOffsetMinutes);
  return local.toISOString().slice(0, 10);
}

export function generateDateKeysInOffset(
  from: Date,
  to: Date,
  tzOffsetMinutes = 0,
): string[] {
  const offsetMs = tzOffsetMinutes * MS_PER_MINUTE;
  const startLocal = new Date(from.getTime() - offsetMs);
  startLocal.setUTCHours(0, 0, 0, 0);
  const endLocal = new Date(to.getTime() - offsetMs);
  endLocal.setUTCHours(0, 0, 0, 0);

  const keys: string[] = [];
  for (
    let ms = startLocal.getTime();
    ms <= endLocal.getTime();
    ms += MS_PER_DAY
  ) {
    keys.push(new Date(ms).toISOString().slice(0, 10));
  }
  return keys;
}

export const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export function getWeekdayIndexInOffset(
  date: Date,
  tzOffsetMinutes = 0,
): number {
  const local = toLocalShiftedDate(date, tzOffsetMinutes);
  const day = local.getUTCDay();
  return (day + 6) % 7;
}

export function getThisWeekRange(tzOffsetMinutes = 0): {
  from: Date;
  to: Date;
  todayWeekdayIndex: number;
} {
  const now = new Date();
  const local = toLocalShiftedDate(now, tzOffsetMinutes);
  const todayWeekdayIndex = (local.getUTCDay() + 6) % 7;
  const localMonday = new Date(local);
  localMonday.setUTCDate(local.getUTCDate() - todayWeekdayIndex);
  localMonday.setUTCHours(0, 0, 0, 0);
  const from = toUtcFromLocalShiftedDate(localMonday, tzOffsetMinutes);
  const to = endOfDayUtcInOffset(now, tzOffsetMinutes);
  return { from, to, todayWeekdayIndex };
}

export function getLastWeekRange(tzOffsetMinutes = 0): {
  from: Date;
  to: Date;
} {
  const { from: thisMonday } = getThisWeekRange(tzOffsetMinutes);
  const from = new Date(thisMonday.getTime() - 7 * MS_PER_DAY);
  const to = new Date(from.getTime() + 7 * MS_PER_DAY - 1);
  return { from, to };
}
