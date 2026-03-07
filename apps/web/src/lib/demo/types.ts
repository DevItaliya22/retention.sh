import type { LoyaltyType } from "@reelo/db";

export type DemoScenarioKey =
  | "cashback"
  | "tier"
  | "amount_spent"
  | "visit_made"
  | "cashback_large"
  | "partner_left"
  | "partner_right";

export interface DemoRunOptions {
  billsPerAccount?: number;
  customersPerAccount?: number;
  dryRun?: boolean;
  scenarioKeys?: DemoScenarioKey[];
}

export interface DemoBillPlan {
  customerIndex: number;
  daysAgo: number;
  targetFinalAmount: number;
  storeDiscount: number;
  taxes: number[];
  shouldCreateFeedback: boolean;
}

export interface DemoCustomerProfile {
  name: string;
  dayOffsets: number[];
  billAmounts: number[];
}

export interface DemoBillLog {
  billNumber: string;
  customerName: string;
  customerPhone: string;
  billId: string;
  createdAt: string;
  targetFinalAmount: number;
  userPaidAmount: number;
  cashbackEarned: number | null;
  cashbackRedeemed: number | null;
  campaignDiscount: number | null;
  hadFeedback: boolean;
}

export interface DemoReferralLog {
  referrer: string;
  referred: string;
  referralLogId: string;
}

export interface DemoAccountLog {
  runId: string;
  accountKey: string;
  loyaltyType: LoyaltyType;
  businessId: string;
  businessName: string;
  businessSlug: string;
  adminUserId: string;
  adminEmail: string;
  adminPassword: string;
  cashierUserId: string;
  cashierId: string;
  cashierEmail: string;
  cashierPassword: string;
  customersCreated: number;
  billsCreated: number;
  campaignsCreated: number;
  feedbackResponsesCreated: number;
  referralsDone: DemoReferralLog[];
  bills: DemoBillLog[];
}

export interface DemoCredentialLog {
  runId: string;
  accountKey: string;
  loyaltyType: LoyaltyType;
  businessName: string;
  businessSlug: string;
  adminUserId: string;
  adminEmail: string;
  adminPassword: string;
  cashierUserId: string;
  cashierId: string;
  cashierEmail: string;
  cashierPassword: string;
}
