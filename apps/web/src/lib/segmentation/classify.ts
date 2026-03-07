import { evaluateSegment } from "./evaluate";
import type { CustomerData, SegmentConfig } from "./types";

export function classifyCustomer(
  customer: CustomerData,
  segments: SegmentConfig[],
  lastBillDate: Date | null,
  now: Date,
  avgSpend: number,
): string {
  const sorted = [...segments].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const segment of sorted) {
    if (evaluateSegment(customer, segment, avgSpend, lastBillDate, now)) {
      return segment.slug;
    }
  }
  return "other";
}
