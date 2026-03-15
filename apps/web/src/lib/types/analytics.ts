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
  totalVisitors: number;
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

// --- Section 6: Insights ---

export interface InsightsResponse {
  revenuePareto: {
    customerPercentage: number;
    revenuePercentage: number;
  };
  averageOrderValue: number;
  avgVisitsPerYear: number;
  error?: string;
}

// --- Customers by day (weekday / weekend / both) ---

export interface CustomersByDayResponse {
  weekdays: number;
  weekends: number;
  both: number;
  total: number;
  weekdaysPercent: number;
  weekendsPercent: number;
  bothPercent: number;
  topLabel: string;
  error?: string;
}

// --- Weekly trends (dashboard) ---

export interface WeeklyTrendsDataPoint {
  day: string;
  thisWeek: number;
  lastWeek: number;
}

export interface WeeklyTrendsResponse {
  visits: {
    data: WeeklyTrendsDataPoint[];
    thisWeekTotal: number;
    lastWeekTotal: number;
  };
  messages: {
    data: WeeklyTrendsDataPoint[];
    thisWeekTotal: number;
    lastWeekTotal: number;
  };
  revenue: {
    data: WeeklyTrendsDataPoint[];
    thisWeekTotal: number;
    lastWeekTotal: number;
  };
  error?: string;
}

// --- Section 7: SKU & Category Analytics ---

export interface SkuOverviewResponse {
  itemsSold: number;
  itemRevenue: number;
  uniqueSkusSold: number;
  avgItemsPerBill: number;
  error?: string;
}

export interface SkuTopItem {
  skuId: string;
  skuName: string;
  skuCode: string;
  categoryName: string | null;
  qtySold: number;
  revenue: number;
  revenueShare: number;
}

export interface SkuTopItemsResponse {
  topSelling: SkuTopItem[];
  slowMoving: Array<{
    skuId: string;
    skuName: string;
    skuCode: string;
    categoryName: string | null;
    qtySold: number;
    lastSoldAt: string | null;
  }>;
  error?: string;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  revenue: number;
  revenueShare: number;
  itemsSold: number;
}

export interface SkuCategoryBreakdownResponse {
  categories: CategoryBreakdownItem[];
  error?: string;
}

export interface SkuTrendDataPoint {
  month: string;
  revenue: number;
  itemsSold: number;
}

export interface SkuTrendResponse {
  data: SkuTrendDataPoint[];
  error?: string;
}

// --- Section 8: Referral Enhanced Analytics ---

export interface ReferralOverviewResponse {
  totalReferrals: number;
  conversionRate: number;
  rewardsCost: number;
  referralRevenue: number;
  avgDaysToFirstVisit: number | null;
  rewardsLocked: number;
  rewardsUnlocked: number;
  avgReferredCustomerSpend: number;
  error?: string;
}

export interface ReferralMonthlyDataPoint {
  month: string;
  totalReferrals: number;
  converted: number;
  rewardsCost: number;
  referralRevenue: number;
}

export interface ReferralMonthlyResponse {
  data: ReferralMonthlyDataPoint[];
  error?: string;
}

// --- Shared ---

export interface AnalyticsQueryParams {
  period?: AnalyticsPeriod;
}
