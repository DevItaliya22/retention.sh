/**
 * Pre-defined terms & conditions options for campaign creation.
 * Users can toggle these on/off; selected items appear on the campaign card.
 */
export const CAMPAIGN_TERMS_OPTIONS = [
  "Min purchase required.",
  "2 offers cannot be clubbed.",
  "Reward cannot be exchanged for cash.",
  "Reward redeemable in-store only.",
  "Merchant reserves the right to the final say in case of any disputes.",
  "Additional T&C apply.",
] as const;

export const CAMPAIGN_REWARD_TYPE_LABELS: Record<string, string> = {
  FREE_ITEM: "Free item",
  PERCENTAGE_DISCOUNT: "% discount",
  CASH_DISCOUNT: "Cash discount",
  NO_REWARD: "No discount",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  SENT: "Sent",
  FAILED: "Failed",
};

export const CAMPAIGN_APPLIES_TO_LABELS: Record<string, string> = {
  ENTIRE_PURCHASE: "Entire purchase",
  SPECIFIC_ITEMS: "Specific Purchase",
};

export const CAMPAIGN_REDEMPTION_LABELS: Record<string, string> = {
  ONCE: "Only once",
  MULTIPLE: "Multiple Times",
};

/**
 * Reward sentence templates per reward type.
 * {value} is replaced with the discount amount the user enters.
 * Used to auto-generate a default offer sentence the user can edit.
 */
export const CAMPAIGN_REWARD_TEMPLATES: Record<string, string> = {
  PERCENTAGE_DISCOUNT:
    "Get {value} off on your entire bill. Visit us today and enjoy the savings!",
  CASH_DISCOUNT:
    "Flat {value} off on your next visit. Treat yourself to something special!",
  FREE_ITEM:
    "Get a {value} absolutely FREE on a **minimum purchase of ₹1000**. Don't miss out!",
  NO_REWARD: "",
};

export const CAMPAIGN_REWARD_PLACEHOLDERS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: "e.g. 10",
  CASH_DISCOUNT: "e.g. 200",
  FREE_ITEM: "e.g. Dessert",
  NO_REWARD: "",
};
