import type { DemoScenarioKey } from "../types";

export type DemoTestFocus = "all" | "cashback" | "partner";

export interface DemoTestOptions {
  baseUrl: string;
  focus: DemoTestFocus;
}

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T | null;
  text: string;
}

export interface TestResult {
  name: string;
  accountKey: DemoScenarioKey | "global";
  passed: boolean;
  status?: number;
  details?: string;
}

export interface RuntimeAccount {
  accountKey: DemoScenarioKey;
  businessId: string;
  businessSlug: string;
  cashierSlug: string;
  cashierEmail: string;
  cashierPassword: string;
  activeSkuId: string;
  inactiveSkuId: string;
}
