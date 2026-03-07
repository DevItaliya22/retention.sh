import type { LoyaltyType } from "@reelo/db";
import type { DemoCustomerProfile } from "./types";

export const DEMO_LOYALTY_TYPES: LoyaltyType[] = [
  "CASHBACK",
  "TIER",
  "AMOUNT_SPENT",
  "VISIT_MADE",
];

export const DEMO_CUSTOMER_PROFILES: DemoCustomerProfile[] = [
  {
    name: "VIP Shopper",
    dayOffsets: [3, 7, 12, 18, 24, 30],
    billAmounts: [5200, 4800, 5300, 4600, 5100, 4900],
  },
  {
    name: "Potential Loyalist",
    dayOffsets: [2, 14, 28, 45],
    billAmounts: [1400, 1300, 1500, 1200],
  },
  {
    name: "Promising",
    dayOffsets: [5, 20, 35],
    billAmounts: [280, 320, 360],
  },
  {
    name: "Loyal",
    dayOffsets: [95, 110, 125, 150],
    billAmounts: [3600, 3400, 3300, 3100],
  },
  {
    name: "At Risk",
    dayOffsets: [190, 220, 260],
    billAmounts: [1350, 1250, 1450],
  },
  {
    name: "Lost",
    dayOffsets: [380],
    billAmounts: [250],
  },
  {
    name: "Referred One",
    dayOffsets: [1, 16],
    billAmounts: [900, 1650],
  },
  {
    name: "Referred Two",
    dayOffsets: [8, 98],
    billAmounts: [780, 1820],
  },
];

export const CAMPAIGN_REWARDS: Array<{
  rewardType:
    | "FREE_ITEM"
    | "PERCENTAGE_DISCOUNT"
    | "CASH_DISCOUNT"
    | "NO_REWARD";
  rewardValue: string | null;
  title: string;
}> = [
  {
    rewardType: "FREE_ITEM",
    rewardValue: "Demo Gift",
    title: "Free Gift Campaign",
  },
  {
    rewardType: "PERCENTAGE_DISCOUNT",
    rewardValue: "12",
    title: "12% Cashback Campaign",
  },
  {
    rewardType: "CASH_DISCOUNT",
    rewardValue: "120",
    title: "Flat 120 Cashback Campaign",
  },
  {
    rewardType: "NO_REWARD",
    rewardValue: null,
    title: "Announcement Campaign",
  },
];

export const DEFAULT_BILLS_PER_ACCOUNT = 25;
export const DEFAULT_CUSTOMERS_PER_ACCOUNT = 8;
