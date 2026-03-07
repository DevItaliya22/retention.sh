import type { AnalyticsPeriod } from "@/lib/schemas/analytics";

// --- Section 1: Highlights ---

export interface HighlightStat {
  label: string;
  value: number;
  previousValue: number;
  todayValue: number;
  format: "currency" | "number" | "percentage";
}

export interface HighlightsResponse {
  totalSales: HighlightStat;
  totalOrders: HighlightStat;
  newCustomers: HighlightStat;
  repeatCustomers: HighlightStat;
  rewardsRedeemed: HighlightStat;
  error?: string;
}

// --- Section 2: Revenue ---

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  aov: number;
}

export interface RevenueResponse {
  data: RevenueDataPoint[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  error?: string;
}

// --- Section 3: Customers (4 separate responses) ---

export interface CustomerSnapshotResponse {
  totalCustomers: number;
  newInPeriod: number;
  repeatInPeriod: number;
  error?: string;
}

export interface NewVsRepeatDataPoint {
  date: string;
  new: number;
  repeat: number;
}

export interface NewVsRepeatResponse {
  data: NewVsRepeatDataPoint[];
  error?: string;
}

export interface FrequencyBucket {
  bucket: string;
  count: number;
}

export interface CustomerFrequencyResponse {
  data: FrequencyBucket[];
  totalVisitors: number;
  error?: string;
}

// --- Section 4: Loyalty (3 separate responses) ---

export interface LoyaltyOverviewResponse {
  redemptionRate: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  avgRevenuePerRedemption: number;
  error?: string;
}

export interface LoyaltyChartDataPoint {
  date: string;
  issued: number;
  redeemed: number;
}

export interface LoyaltyChartResponse {
  data: LoyaltyChartDataPoint[];
  error?: string;
}

export interface TopReward {
  name: string;
  count: number;
}

export interface TopRewardsResponse {
  data: TopReward[];
  error?: string;
}

// --- Section 5: RFM (legacy, deprecated) ---

export interface RfmSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RfmResponse {
  totalCustomers: number;
  segments: RfmSegment[];
  error?: string;
}

// --- Section 5b: Customer Segments ---

export interface CustomerSegment {
  name: string;
  slug: string;
  count: number;
  percentage: number;
  description?: string | null;
  proTip?: string | null;
}

export interface CustomerSegmentsResponse {
  totalCustomers: number;
  segments: CustomerSegment[];
  error?: string;
}

export interface SegmentCustomersResponse {
  items: Array<{
    id: string;
    slugId: string;
    customerId: string;
    name: string;
    email: string;
    phone: string | null;
    pointsBalance: number;
    cashbackBalance: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

// --- Section 6: Engagement (3 separate responses) ---

export interface FeedbackTrendPoint {
  date: string;
  avgRating: number;
  count: number;
}

export interface FeedbackAnalyticsResponse {
  total: number;
  averageRating: number;
  negativePercentage: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  trend: FeedbackTrendPoint[];
  error?: string;
}

export interface CampaignAnalyticsResponse {
  totalSent: number;
  whatsappCount: number;
  smsCount: number;
  emailCount: number;
  error?: string;
}

export interface ReferralAnalyticsResponse {
  totalReferred: number;
  converted: number;
  conversionRate: number;
  totalRewardPoints: number;
  error?: string;
}

// --- Section 7: Insights ---

export interface InsightsResponse {
  revenuePareto: {
    customerPercentage: number;
    revenuePercentage: number;
  };
  averageOrderValue: number;
  avgVisitsPerYear: number;
  error?: string;
}

// --- Shared ---

export interface AnalyticsQueryParams {
  period?: AnalyticsPeriod;
}
