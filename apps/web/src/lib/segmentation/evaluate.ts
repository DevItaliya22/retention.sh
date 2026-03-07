import type { SegmentOperator } from "@reelo/db";
import type { CustomerData, SegmentConfig } from "./types";

const DAYS_PER_MONTH = 30.44;

function toDays(value: number, unit: "DAYS" | "MONTHS" | null): number {
  if (unit === "MONTHS") return value * DAYS_PER_MONTH;
  return value;
}

function matchesOperator(
  value: number,
  op: SegmentOperator | null,
  v1: number | null,
  v2: number | null,
): boolean {
  if (op == null || v1 == null) return true;
  switch (op) {
    case "LESS_THAN":
      return value < v1;
    case "GREATER_THAN":
      return value > v1;
    case "LESS_THAN_OR_EQUAL":
      return value <= v1;
    case "GREATER_THAN_OR_EQUAL":
      return value >= v1;
    case "IN_RANGE":
      return v2 != null && value >= v1 && value <= v2;
    case "NOT_IN_RANGE":
      return v2 != null && (value < v1 || value > v2);
    default:
      return true;
  }
}

export function evaluateSegment(
  customer: CustomerData,
  segment: SegmentConfig,
  avgSpend: number,
  lastBillDate: Date | null,
  now: Date,
): boolean {
  const lastActivity =
    customer.lastVisitAt ?? lastBillDate ?? customer.createdAt;
  const daysSinceVisit = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
  );

  const recencyVal = segment.recencyValue ?? 0;
  const recencyVal2 = segment.recencyValue2;
  const recencyDays = toDays(recencyVal, segment.recencyUnit ?? "DAYS");
  const recencyDays2 =
    recencyVal2 != null
      ? toDays(recencyVal2, segment.recencyUnit ?? "DAYS")
      : null;

  if (
    segment.recencyOperator != null &&
    !matchesOperator(
      daysSinceVisit,
      segment.recencyOperator,
      recencyDays,
      recencyDays2,
    )
  ) {
    return false;
  }

  if (
    segment.frequencyOperator != null &&
    !matchesOperator(
      customer.visitCount,
      segment.frequencyOperator,
      segment.frequencyValue ?? 0,
      segment.frequencyValue2 ?? null,
    )
  ) {
    return false;
  }

  const monetaryRatio = avgSpend > 0 ? customer.lifetimeSpend / avgSpend : 0;
  if (
    segment.monetaryOperator != null &&
    !matchesOperator(
      monetaryRatio,
      segment.monetaryOperator,
      segment.monetaryValue ?? 0,
      segment.monetaryValue2 ?? null,
    )
  ) {
    return false;
  }

  return true;
}
