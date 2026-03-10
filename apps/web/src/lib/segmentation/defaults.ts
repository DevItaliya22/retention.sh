import type { MonetaryUnit, SegmentOperator } from "@reelo/db";

export interface DefaultSegmentDef {
  name: string;
  slug: string;
  description: string;
  proTip: string;
  sortOrder: number;
  recencyOperator: SegmentOperator | null;
  recencyValue: number | null;
  recencyValue2: number | null;
  frequencyOperator: SegmentOperator | null;
  frequencyValue: number | null;
  frequencyValue2: number | null;
  monetaryUnit: MonetaryUnit | null;
  monetaryOperator: SegmentOperator | null;
  monetaryValue: number | null;
  monetaryValue2: number | null;
}

export const DEFAULT_SEGMENTS: DefaultSegmentDef[] = [
  {
    name: "Lost",
    slug: "lost",
    description:
      "These customers have not visited your business in a very long time or very often, and they have spent the least.",
    proTip: "Explore our win-back campaigns and win them over!",
    sortOrder: 0,
    recencyOperator: "GREATER_THAN_OR_EQUAL",
    recencyValue: 365,
    recencyValue2: null,
    frequencyOperator: null,
    frequencyValue: null,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "LESS_THAN",
    monetaryValue: 0.5,
    monetaryValue2: null,
  },
  {
    name: "VIP",
    slug: "vip",
    description:
      "These customers are frequent visitors who have recently been to your business and spend the most.",
    proTip:
      "Invite them to exclusive events, store openings, or just pamper them with special offers!",
    sortOrder: 1,
    recencyOperator: "LESS_THAN_OR_EQUAL",
    recencyValue: 90,
    recencyValue2: null,
    frequencyOperator: "GREATER_THAN_OR_EQUAL",
    frequencyValue: 5,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "GREATER_THAN_OR_EQUAL",
    monetaryValue: 3,
    monetaryValue2: null,
  },
  {
    name: "Loyal",
    slug: "loyal",
    description:
      "These are frequent visitors, and they spend the most, but they haven't visited in a while.",
    proTip:
      "Offer them related products to upsell or cross-sell. They're likely to make a purchase!",
    sortOrder: 2,
    recencyOperator: "IN_RANGE",
    recencyValue: 90,
    recencyValue2: 180,
    frequencyOperator: "GREATER_THAN_OR_EQUAL",
    frequencyValue: 4,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "GREATER_THAN",
    monetaryValue: 1.5,
    monetaryValue2: null,
  },
  {
    name: "Can't Loose",
    slug: "cant-loose",
    description:
      "These customers visit your business frequently and spend a lot, but it's been a while since their last visit.",
    proTip:
      "These are your important customers. Send a personalised campaign to bring them back!",
    sortOrder: 3,
    recencyOperator: "IN_RANGE",
    recencyValue: 90,
    recencyValue2: 180,
    frequencyOperator: "GREATER_THAN_OR_EQUAL",
    frequencyValue: 10,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "GREATER_THAN",
    monetaryValue: 1.5,
    monetaryValue2: null,
  },
  {
    name: "About to sleep",
    slug: "about-to-sleep",
    description:
      "These customers visited your business sometime back, but they don't usually visit frequently and are low spenders.",
    proTip:
      "Win them back with a free incentive. We've seen it work like a charm!",
    sortOrder: 4,
    recencyOperator: "IN_RANGE",
    recencyValue: 90,
    recencyValue2: 180,
    frequencyOperator: "IN_RANGE",
    frequencyValue: 1,
    frequencyValue2: 3,
    monetaryUnit: "RATIO",
    monetaryOperator: "LESS_THAN",
    monetaryValue: 0.5,
    monetaryValue2: null,
  },
  {
    name: "At Risk",
    slug: "at-risk",
    description:
      "These customers are average spenders, but they haven't visited your business recently.",
    proTip:
      "Act fast before they're gone, and offer something they can't resist!",
    sortOrder: 5,
    recencyOperator: "IN_RANGE",
    recencyValue: 180,
    recencyValue2: 365,
    frequencyOperator: null,
    frequencyValue: null,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "IN_RANGE",
    monetaryValue: 0.5,
    monetaryValue2: 1.5,
  },
  {
    name: "Potential Loyalist",
    slug: "potential-loyalist",
    description:
      "These customers have visited your business recently, but they aren't frequent visitors and are average spenders.",
    proTip:
      "Win them back! Use seasonal campaigns to reignite their love for your brand!",
    sortOrder: 6,
    recencyOperator: "LESS_THAN_OR_EQUAL",
    recencyValue: 60,
    recencyValue2: null,
    frequencyOperator: "IN_RANGE",
    frequencyValue: 1,
    frequencyValue2: 3,
    monetaryUnit: "RATIO",
    monetaryOperator: "IN_RANGE",
    monetaryValue: 0.5,
    monetaryValue2: 1.5,
  },
  {
    name: "Promising",
    slug: "promising",
    description:
      "These customers have visited your business recently, but they haven't spent much.",
    proTip:
      "Send tempting offers and give them a friendly brand recall to encourage their return!",
    sortOrder: 7,
    recencyOperator: "LESS_THAN_OR_EQUAL",
    recencyValue: 60,
    recencyValue2: null,
    frequencyOperator: null,
    frequencyValue: null,
    frequencyValue2: null,
    monetaryUnit: "RATIO",
    monetaryOperator: "LESS_THAN",
    monetaryValue: 0.5,
    monetaryValue2: null,
  },
  {
    name: "Needs Attention",
    slug: "needs-attention",
    description:
      "These customers visit very occasionally, spend an average amount, and haven't made a purchase recently.",
    proTip: "Reconnect with a friendly touch, send them a personalised offer!",
    sortOrder: 8,
    recencyOperator: "IN_RANGE",
    recencyValue: 90,
    recencyValue2: 180,
    frequencyOperator: "IN_RANGE",
    frequencyValue: 2,
    frequencyValue2: 3,
    monetaryUnit: "RATIO",
    monetaryOperator: "IN_RANGE",
    monetaryValue: 0.5,
    monetaryValue2: 1.5,
  },
  {
    name: "Other",
    slug: "other",
    description: "Customers who don't match the other segment criteria.",
    proTip:
      "Review segment rules or add a custom segment to better categorize them.",
    sortOrder: 9,
    recencyOperator: null,
    recencyValue: null,
    recencyValue2: null,
    frequencyOperator: null,
    frequencyValue: null,
    frequencyValue2: null,
    monetaryUnit: null,
    monetaryOperator: null,
    monetaryValue: null,
    monetaryValue2: null,
  },
];
