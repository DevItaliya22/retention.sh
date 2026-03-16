export interface CampaignPreviewData {
  title: string | null;
  description: string | null;
  contactNumber: string | null;
  rewardValue: string | null;
  expiresAt: string | null;
  termsAndConditions: string[];
  maxRedemptionEnabled?: boolean;
  maxRedemptionAmount?: number | null;
  minPurchaseForEarningEnabled?: boolean;
  minPurchaseForEarning?: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;
  instantCashbackRedeemable?: boolean;
  redemptionLimit?: string | null;
}

export interface CampaignPreviewBranding {
  logo: string | null;
  themeColor: string | null;
  textColor: string | null;
  bannerImage: string | null;
}

export interface CampaignTemplateProps {
  data: CampaignPreviewData;
  branding: CampaignPreviewBranding;
  businessName?: string | null;
  className?: string;
  onFieldClick?: (fieldName: string) => void;
}
