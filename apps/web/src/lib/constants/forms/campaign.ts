/**
 * Default terms pre-filled when creating a new campaign.
 * Uses loyalty defaults for consistency.
 */
export const CAMPAIGN_DEFAULT_TERMS = [
  "Points/cashback are non-transferable and have no cash value except as stated.",
  "We reserve the right to modify or discontinue this program with reasonable notice.",
] as const;

/**
 * Pre-defined terms & conditions options for campaign creation.
 * Users can toggle these on/off; selected items appear on the campaign card.
 * Matches loyalty defaults for consistency.
 */
export const CAMPAIGN_TERMS_OPTIONS = [
  "Points/cashback are non-transferable and have no cash value except as stated.",
  "We reserve the right to modify or discontinue this program with reasonable notice.",
  "Multiple offers cannot be combined in a single bill.",
  "Minimum purchase may be required for some rewards.",
  "Rewards are not redeemable on public holidays.",
  "Reward is redeemable in-store only.",
] as const;

export const CAMPAIGN_REWARD_TYPE_LABELS: Record<string, string> = {
  FREE_ITEM: "Free item",
  PERCENTAGE_DISCOUNT: "% discount",
  CASH_DISCOUNT: "Cash discount",
  NO_REWARD: "No discount",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
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
