import type { LoyaltyTransaction } from "./types";

export const TX_PER_PAGE = 15;

export function getFreeItemName(tx: LoyaltyTransaction): string | null {
  const meta = tx.metadata as { freeItemName?: string } | null;
  return meta?.freeItemName ?? null;
}

export function getTransactionLabel(tx: LoyaltyTransaction): string {
  if (tx.type === "EXPIRED")
    return tx.valueKind === "CASHBACK" ? "Cashback expired" : "Points expired";
  if (tx.type === "ADJUSTMENT") return "Balance adjustment";
  if (tx.type === "REFUNDED") return "Refund";
  if (tx.type === "GIFTED") return "Gift";

  if (tx.source === "CAMPAIGN") {
    const campName = tx.campaignTitle ?? "";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx) ?? "Free item";
      return campName ? `${itemName} (${campName})` : itemName;
    }
    if (tx.type === "EARNED")
      return campName ? `Campaign cashback: ${campName}` : "Campaign cashback";
    if (tx.type === "REDEEMED")
      return campName ? `Campaign discount: ${campName}` : "Campaign discount";
  }

  if (tx.source === "REFERRAL")
    return tx.type === "EARNED" ? "Referral reward" : "Referral";
  if (tx.source === "FEEDBACK") return "Feedback reward";

  if (tx.type === "EARNED") {
    if (tx.valueKind === "CASHBACK") return "Loyalty cashback";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx);
      return itemName ? `Free item: ${itemName}` : "Free item earned";
    }
    return "Points earned";
  }
  if (tx.type === "REDEEMED") {
    if (tx.valueKind === "CASHBACK") return "Cashback redeemed";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx);
      return itemName ? `Claimed: ${itemName}` : "Free item claimed";
    }
    return "Points redeemed";
  }

  return tx.description || tx.source;
}

export function formatSource(source: string) {
  switch (source) {
    case "REFERRAL":
      return "Referral";
    case "CAMPAIGN":
      return "Campaign";
    case "LOYALTY":
      return "Loyalty";
    default:
      return source === "OTHER" ? "" : source;
  }
}

export function formatCurrency(
  amount: number,
  symbol = "₹",
  abs = true,
): string {
  const val = abs ? Math.abs(amount) : amount;
  return `${symbol}${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCustomerDisplayName(customer: {
  name: string | null;
  email: string | null;
}): string {
  return customer.name?.trim() || customer.email?.split("@")[0] || "Member";
}
