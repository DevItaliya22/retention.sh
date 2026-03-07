import type { RecencyUnit, SegmentOperator } from "@reelo/db";

export type { RecencyUnit, SegmentOperator };

export interface SegmentConfig {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  proTip: string | null;
  recencyOperator: SegmentOperator | null;
  recencyValue: number | null;
  recencyValue2: number | null;
  recencyUnit: RecencyUnit | null;
  frequencyOperator: SegmentOperator | null;
  frequencyValue: number | null;
  frequencyValue2: number | null;
  monetaryOperator: SegmentOperator | null;
  monetaryValue: number | null;
  monetaryValue2: number | null;
  sortOrder: number;
  isSystem: boolean;
}

export interface CustomerData {
  customerId: string;
  visitCount: number;
  lifetimeSpend: number;
  lastVisitAt: Date | null;
  createdAt: Date;
}
