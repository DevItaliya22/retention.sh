export interface RewardStage {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
}

export interface TierData {
  name: string;
  minLifetimeSpend: number;
  maxLifetimeSpend: number | null;
  cashbackPercentage: number;
}

export interface TierInfo {
  currentTier: { name: string; cashbackPercentage: number } | null;
  allTiers: TierData[];
  lifetimeSpend: number;
  nextTier: {
    name: string;
    minLifetimeSpend: number;
    cashbackPercentage: number;
  } | null;
  spendToNextTier: number | null;
}

export interface AmountSpentInfo {
  pointsPerRupee: number;
  rewardStages: RewardStage[];
  nextStage: {
    rewardName: string;
    pointsRequired: number;
    pointsNeeded: number;
  } | null;
}

export interface VisitMadeInfo {
  visitCount: number;
  pointsPerVisit: number;
  rewardStages: RewardStage[];
  nextStage: {
    rewardName: string;
    pointsRequired: number;
    pointsNeeded: number;
  } | null;
}

export interface FreeItem {
  id: string;
  skuId: string | null;
  skuName: string;
  source: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  valueKind: string;
  amount: number;
  type: string;
  source: string;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
  metadata: unknown;
  campaignTitle: string | null;
}

export interface LoyaltyBranding {
  logoUrl: string | null;
  bannerImageUrl: string | null;
  themeColor: string | null;
  textColor: string | null;
  header: string | null;
  subtitle: string | null;
}

export interface LoyaltyData {
  customer: { name: string | null; email: string | null };
  business: {
    name: string;
    slug: string;
    currencySymbol: string;
    currencyCode: string;
  };
  loyaltyType: string | null;
  pointsBalance: number;
  cashbackBalance: number;
  freeItems: FreeItem[];
  transactions: LoyaltyTransaction[];
  tierInfo: TierInfo | null;
  amountSpentInfo: AmountSpentInfo | null;
  visitMadeInfo: VisitMadeInfo | null;
  branding: LoyaltyBranding | null;
}

export interface LoyaltyDetailResponse {
  loyalty: LoyaltyData | null;
  error?: string;
}
