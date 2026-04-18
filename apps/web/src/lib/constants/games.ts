export const GAME_TYPE_LABELS: Record<string, string> = {
  SPIN_WHEEL: "Spin wheel",
  LOTTERY: "Lottery",
  SCRATCH_CARD: "Scratch & win",
};

export const GAME_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Not live",
  ACTIVE: "Running",
  PAUSED: "Paused",
  COMPLETED: "Finished",
  ARCHIVED: "Archived",
};

export const GAME_STATUS_TONES: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  PAUSED: "outline",
  COMPLETED: "outline",
  ARCHIVED: "outline",
};

export const GAME_REWARD_KIND_LABELS: Record<string, string> = {
  NONE: "No prize (try again)",
  LOYALTY_POINTS: "Loyalty points",
  CASHBACK: "Cashback (₹)",
  FREE_ITEM: "Free item",
  PERCENTAGE_DISCOUNT: "Percentage discount",
  VOUCHER_CODE: "Voucher code",
};

export const GAME_DISTRIBUTION_MODE_LABELS: Record<string, string> = {
  PROBABILITY_WEIGHTED: "Weighted probability",
  POPULATION_RATIO: "Fixed ratio (e.g. 10 winners per 100 plays)",
  FIXED_WINNER_COUNT: "Fixed total winners",
  FIRST_N: "First N players win",
};

export const GAME_DISTRIBUTION_MODE_HELP: Record<string, string> = {
  PROBABILITY_WEIGHTED:
    "Each prize has a weight or percentage. A random draw picks a prize each time someone plays.",
  POPULATION_RATIO:
    "Every fixed window of plays (e.g. every 100 plays), a fixed number of players win.",
  FIXED_WINNER_COUNT:
    "Only a set number of players can ever win across the entire campaign.",
  FIRST_N: "The first N players to play and qualify always win.",
};

export const GAME_ELIGIBILITY_EVENT_LABELS: Record<string, string> = {
  BILL_CREATED: "When a customer pays a bill",
  VISIT_QUALIFIED: "When a visit qualifies",
  REFERRAL_COMPLETED: "When a referral is completed",
  CAMPAIGN_ACTION: "When a campaign is acted on",
  MANUAL_GRANT: "Only by staff (manual grant)",
};

export const GAME_INTERVAL_UNIT_LABELS: Record<string, string> = {
  MINUTE: "minutes",
  HOUR: "hours",
  DAY: "days",
  WEEK: "weeks",
  MONTH: "months",
};

export const GAME_FULFILLMENT_MODE_LABELS: Record<string, string> = {
  INSTANT: "Instant (wheel / scratch)",
  SCHEDULED_DRAW: "Scheduled draw (lottery)",
};
