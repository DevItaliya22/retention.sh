import type { LoyaltyType } from "@reelo/db";

export interface DemoRunOptions {
  billsPerAccount?: number;
  customersPerAccount?: number;
  dryRun?: boolean;
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
