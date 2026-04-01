"use client";

import { fetcher } from "@/lib/fetcher";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Separator,
} from "@reelo/ui/components";
import {
  CheckCircle2,
  Gift,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface RedeemInfo {
  loyaltyType: string;
  availableForRedeem: number;
  maxRedeemable: number;
  balance: number;
  cashbackBalance?: number;
  pointsBalance?: number;
  maxRedeemableFromCashback?: number;
  maxRedeemableFromPoints?: number;
  tierInfo?: { currentTierName: string; cashbackPercentage: number } | null;
  /** TIER only: when no tier (below first), message for cashier. */
  tierMessage?: string | null;
  rewardStages: Array<{
    id: string;
    rewardName: string;
    rewardType: string;
    pointsRequired: number;
    canRedeem: boolean;
  }>;
  /** True when this bill was already redeemed (one redemption per bill). */
  alreadyRedeemedOnThisBill?: boolean;
  /** Locked cashback (Shopify return window). Not redeemable. */
  lockedCashback?: number;
  /** Locked referral cashback (until referred's first bill). Not redeemable. */
  lockedReferralCashback?: number;
}

interface FreeItemToClaim {
  id: string;
  skuId: string | null;
  skuName: string;
  source: string;
  createdAt: string;
}

interface CampaignEarning {
  campaignId: string;
  campaignTitle: string | null;
  rewardType: string;
  earnedAmount: number;
  autoRedeemed: number;
  freeItemName: string | null;
}

interface PartnerRedeemableItem {
  partnerBusinessId: string;
  partnerBusinessName: string;
  loyaltyType: string;
  balance: number;
  valueAtCurrentStore: number;
  maxRedeemableOnBill: number;
  lockedCashback?: number;
  lockedReferralCashback?: number;
}

interface RedeemInfoBill {
  id: string;
  billNumber: string;
  finalAmount: number | null;
  userPaidAmount: number | null;
  cashbackAmount: number | null;
  cashbackRedeemedAmount: number | null;
  partnerRedeemedAmount?: number | null;
  campaignDiscountAmount?: number | null;
  /** Which partner was used on this bill (one partner per bill). */
  redeemedFromPartnerBusinessId?: string | null;
  earnedCashback?: number;
  earnedPoints?: number;
  /** True when earn is deferred (will be applied on Create Another Bill). */
  earnNotYetApplied?: boolean;
  pendingCashbackEarn?: number;
  pendingPointsEarn?: number;
  /** Free items redeemed on this bill (points → FREE_ITEM reward). */
  redeemedFreeItems?: Array<{
    rewardName: string;
    freeItemName: string | null;
  }>;
}

interface BillCreatedViewProps {
  billId: string;
  businessId: string;
  onCreateAnother: () => void;
}

export function BillCreatedView({
  billId,
  businessId,
  onCreateAnother,
}: BillCreatedViewProps) {
  const router = useRouter();
  const [data, setData] = useState<{
    bill: RedeemInfoBill;
    redeemInfo: RedeemInfo | null;
    partnerRedeemable: PartnerRedeemableItem[];
    freeItems: FreeItemToClaim[];
    campaignEarnings: CampaignEarning[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemCashbackValue, setRedeemCashbackValue] = useState("");
  const [redeemPointsValue, setRedeemPointsValue] = useState("");
  const [selectedRewardStageId, setSelectedRewardStageId] = useState<
    string | null
  >(null);
  const [redeeming, setRedeeming] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  /** Per-partner input value (partnerBusinessId -> value string) */
  const [partnerRedeemValues, setPartnerRedeemValues] = useState<
    Record<string, string>
  >({});
  const [redeemingPartnerId, setRedeemingPartnerId] = useState<string | null>(
    null,
  );
  const [finalizing, setFinalizing] = useState(false);

  const basePath = `/api/cashier/bills/${billId}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher<{
        bill: RedeemInfoBill;
        redeemInfo: RedeemInfo | null;
        partnerRedeemable?: PartnerRedeemableItem[];
        freeItems?: FreeItemToClaim[];
        campaignEarnings?: CampaignEarning[];
        error?: string;
      }>(`${basePath}/redeem-info`);
      if (res.error) throw new Error(res.error);
      setData({
        bill: res.bill,
        redeemInfo: res.redeemInfo,
        partnerRedeemable: res.partnerRedeemable ?? [],
        freeItems: res.freeItems ?? [],
        campaignEarnings: res.campaignEarnings ?? [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bill");
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async () => {
    if (!data?.redeemInfo) return;
    const isCashback =
      data.redeemInfo.loyaltyType === "CASHBACK" ||
      data.redeemInfo.loyaltyType === "TIER";
    const cashbackVal = Math.max(0, parseFloat(redeemCashbackValue) || 0);
    const wantsConvert = !isCashback && !!selectedRewardStageId;
    const wantsCashbackOnBill = cashbackVal > 0;

    if (!wantsConvert && !wantsCashbackOnBill) {
      toast.error(
        isCashback
          ? "Enter cashback amount to redeem"
          : "Select a reward to convert points, or enter cashback amount to apply to bill",
      );
      return;
    }

    const maxCashback = isCashback
      ? data.redeemInfo.maxRedeemable
      : (data.redeemInfo.maxRedeemableFromCashback ?? 0);
    if (wantsCashbackOnBill && cashbackVal > maxCashback) {
      toast.error(
        `Cannot redeem more than ₹${maxCashback.toFixed(2)} cashback on this bill`,
      );
      return;
    }

    setRedeeming(true);
    try {
      const body: {
        redeemCashback?: number;
        rewardStageId?: string | null;
      } = {};
      if (wantsCashbackOnBill) body.redeemCashback = cashbackVal;
      if (wantsConvert) body.rewardStageId = selectedRewardStageId;

      const res = await fetcher<{
        bill: object;
        convert?: {
          pointsBalance: number;
          cashbackBalance: number;
          redeemedFreeItems?: Array<{
            rewardName: string;
            freeItemName: string | null;
          }>;
        };
        error?: string;
      }>(`${basePath}/redeem`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.error) throw new Error(res.error);

      if (wantsConvert && res.convert?.redeemedFreeItems?.length) {
        toast.success(
          `Redeemed: ${res.convert.redeemedFreeItems.map((i) => i.freeItemName ?? i.rewardName).join(", ")}`,
        );
      } else if (wantsConvert) {
        toast.success("Points converted to cashback");
      }
      if (wantsCashbackOnBill) {
        toast.success("Cashback applied to bill");
      }

      setRedeemCashbackValue("");
      setRedeemPointsValue("");
      setSelectedRewardStageId(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to redeem");
    } finally {
      setRedeeming(false);
    }
  };

  const handleCreateAnother = async () => {
    setFinalizing(true);
    try {
      await fetcher<{ applied?: boolean; error?: string }>(
        `${basePath}/finalize-earn`,
        {
          method: "POST",
        },
      );
      onCreateAnother();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to finish. Please try again.",
      );
    } finally {
      setFinalizing(false);
    }
  };

  /** For CASHBACK/TIER: max discount at this store (₹). For points: max partner points. */
  const getMaxPartnerValue = (p: PartnerRedeemableItem) => {
    const isCashback = p.loyaltyType === "CASHBACK" || p.loyaltyType === "TIER";
    if (p.balance <= 0 || p.valueAtCurrentStore <= 0) return 0;
    if (isCashback) return p.maxRedeemableOnBill;
    const raw = (p.maxRedeemableOnBill * p.balance) / p.valueAtCurrentStore;
    return Math.min(p.balance, Math.floor(raw));
  };

  /** Convert input to partner amount for API. For CASHBACK/TIER input is discount here (₹) → partner amount. */
  const partnerInputToApiAmount = (
    p: PartnerRedeemableItem,
    inputValue: number,
  ) => {
    const isCashback = p.loyaltyType === "CASHBACK" || p.loyaltyType === "TIER";
    if (!isCashback) return inputValue;
    if (p.valueAtCurrentStore <= 0) return 0;
    return Math.min(
      p.balance,
      Math.floor(((inputValue * p.balance) / p.valueAtCurrentStore) * 100) /
        100,
    );
  };

  const handlePartnerRedeem = async (partnerBusinessId: string) => {
    if (!data?.partnerRedeemable?.length) return;
    const partner = data.partnerRedeemable.find(
      (p) => p.partnerBusinessId === partnerBusinessId,
    );
    if (!partner || partner.maxRedeemableOnBill <= 0) return;
    const isPartnerCashback =
      partner.loyaltyType === "CASHBACK" || partner.loyaltyType === "TIER";
    const raw = partnerRedeemValues[partnerBusinessId] ?? "";
    const inputVal = isPartnerCashback
      ? Math.max(0, parseFloat(raw) || 0)
      : Math.max(0, Math.floor(parseInt(raw, 10) || 0));
    if (inputVal <= 0) {
      toast.error("Enter amount or points to redeem from partner");
      return;
    }
    const maxVal = getMaxPartnerValue(partner);
    if (inputVal > maxVal) {
      toast.error(
        isPartnerCashback
          ? `Cannot redeem more than ₹${maxVal.toFixed(2)} on this bill from ${partner.partnerBusinessName}`
          : `Cannot redeem more than ${maxVal} points from ${partner.partnerBusinessName}`,
      );
      return;
    }
    const val = partnerInputToApiAmount(partner, inputVal);
    if (val <= 0) {
      toast.error("Invalid amount");
      return;
    }
    setRedeemingPartnerId(partnerBusinessId);
    try {
      const body: {
        redeemFromPartnerBusinessId: string;
        redeemPartnerCashback?: number;
        redeemPartnerPoints?: number;
      } = { redeemFromPartnerBusinessId: partnerBusinessId };
      if (isPartnerCashback) body.redeemPartnerCashback = val;
      else body.redeemPartnerPoints = val;
      const res = await fetcher<{ bill: object; error?: string }>(
        `${basePath}/redeem`,
        { method: "POST", body: JSON.stringify(body) },
      );
      if (res.error) throw new Error(res.error);
      toast.success("Partner balance applied to bill");
      setPartnerRedeemValues((prev) => {
        const next = { ...prev };
        delete next[partnerBusinessId];
        return next;
      });
      fetchData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply partner",
      );
    } finally {
      setRedeemingPartnerId(null);
    }
  };

  const handleClaimFreeItem = async (freeItemId: string) => {
    setClaimingId(freeItemId);
    try {
      const res = await fetcher<{ success: boolean; error?: string }>(
        `${basePath}/claim-free-item`,
        {
          method: "POST",
          body: JSON.stringify({ freeItemId }),
        },
      );
      if (res.error) throw new Error(res.error);
      toast.success("Free item claimed");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to claim");
    } finally {
      setClaimingId(null);
    }
  };

  const dynamicCashbackEarn = useMemo(() => {
    const bill = data?.bill;
    if (!bill) return 0;
    if (!bill.earnNotYetApplied) return bill.earnedCashback ?? 0;
    const baseEarn =
      bill.cashbackAmount ??
      bill.pendingCashbackEarn ??
      bill.earnedCashback ??
      0;
    if (baseEarn <= 0) return 0;
    const currentPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;
    const alreadyRedeemed =
      (bill.cashbackRedeemedAmount ?? 0) + (bill.partnerRedeemedAmount ?? 0);
    const originalPayable = currentPay + alreadyRedeemed;
    if (originalPayable <= 0) return 0;
    const typed = Math.max(0, parseFloat(redeemCashbackValue) || 0);
    const newPay = Math.max(0, currentPay - typed);
    return Math.round(baseEarn * (newPay / originalPayable) * 100) / 100;
  }, [data?.bill, redeemCashbackValue]);

  const dynamicPointsEarn = useMemo(() => {
    const bill = data?.bill;
    if (!bill) return 0;
    if (!bill.earnNotYetApplied) return bill.earnedPoints ?? 0;
    const baseEarn = bill.pendingPointsEarn ?? bill.earnedPoints ?? 0;
    if (baseEarn <= 0) return 0;
    const currentPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;
    const alreadyRedeemed =
      (bill.cashbackRedeemedAmount ?? 0) + (bill.partnerRedeemedAmount ?? 0);
    const originalPayable = currentPay + alreadyRedeemed;
    if (originalPayable <= 0) return 0;
    const typed = Math.max(0, parseFloat(redeemCashbackValue) || 0);
    const newPay = Math.max(0, currentPay - typed);
    return Math.round(baseEarn * (newPay / originalPayable));
  }, [data?.bill, redeemCashbackValue]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <p className="text-destructive">{error || "Bill not found"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleCreateAnother}
          >
            Create Another Bill
          </Button>
        </CardContent>
      </Card>
    );
  }

  const bill = data.bill;
  const redeemInfo = data.redeemInfo;
  const isCashback =
    redeemInfo &&
    (redeemInfo.loyaltyType === "CASHBACK" ||
      redeemInfo.loyaltyType === "TIER");
  const alreadyRedeemedAtOurStore =
    redeemInfo?.alreadyRedeemedOnThisBill === true;
  const alreadyUsedPartner = (bill.partnerRedeemedAmount ?? 0) > 0;
  const alreadyRedeemedOnThisBill =
    alreadyRedeemedAtOurStore || alreadyUsedPartner;
  const redeemableRewards =
    redeemInfo?.rewardStages?.filter((r) => r.canRedeem) ?? [];
  const canRedeemAtOurStore =
    redeemInfo &&
    !alreadyUsedPartner &&
    (redeemInfo.maxRedeemable > 0 ||
      (redeemInfo.maxRedeemableFromCashback ?? 0) > 0 ||
      (redeemInfo.maxRedeemableFromPoints ?? 0) > 0 ||
      redeemableRewards.length > 0);
  const canRedeemFromPartner =
    !alreadyRedeemedAtOurStore && (data.partnerRedeemable?.length ?? 0) > 0;
  const hasRedeemOptions = canRedeemAtOurStore || canRedeemFromPartner;

  return (
    <Card className="w-full max-w-md border-0 shadow-none">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Bill Created Successfully</h3>
            <p className="text-muted-foreground mt-1">
              Bill #{bill.billNumber}
            </p>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/40 space-y-1 rounded-lg px-4 py-3">
          {(bill.finalAmount ?? 0) > 0 &&
            (bill.campaignDiscountAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bill total</span>
                <span className="font-medium">
                  ₹{(bill.finalAmount ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          {(bill.campaignDiscountAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>Campaign discount</span>
              <span className="font-medium">
                -₹{(bill.campaignDiscountAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          {(bill.partnerRedeemedAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm text-violet-600 dark:text-violet-400">
              <span>Partner balance redeemed</span>
              <span className="font-medium">
                -₹{(bill.partnerRedeemedAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-base">
            <span className="text-muted-foreground font-medium">
              Amount to pay
            </span>
            <span className="text-lg font-semibold">
              ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {data.campaignEarnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Campaign rewards
            </p>
            {data.campaignEarnings.map((c) => (
              <div
                key={c.campaignId}
                className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20"
              >
                <Sparkles className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
                <div className="text-sm">
                  {c.rewardType === "FREE_ITEM" ? (
                    <p className="font-medium text-orange-700 dark:text-orange-300">
                      {c.freeItemName
                        ? `${c.freeItemName} earned`
                        : "Free item earned"}
                    </p>
                  ) : c.autoRedeemed > 0 ? (
                    <p className="font-medium text-orange-700 dark:text-orange-300">
                      ₹{c.autoRedeemed.toFixed(2)} cashback applied to this bill
                    </p>
                  ) : c.earnedAmount > 0 ? (
                    <>
                      <p className="font-medium text-orange-700 dark:text-orange-300">
                        ₹{c.earnedAmount.toFixed(2)} cashback earned
                      </p>
                      <p className="text-muted-foreground">
                        Redeemable on your next bill
                      </p>
                    </>
                  ) : null}
                  {c.campaignTitle && (
                    <p className="text-muted-foreground text-xs">
                      {c.campaignTitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {((bill.earnedCashback ?? 0) > 0 || (bill.earnedPoints ?? 0) > 0) && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Loyalty rewards
            </p>
            {(bill.earnedCashback ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <Sparkles className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    {bill.earnNotYetApplied
                      ? `You will earn ₹${dynamicCashbackEarn.toFixed(2)} cashback from loyalty when you finish (click Create Another Bill).`
                      : `You have earned ₹${(bill.earnedCashback ?? 0).toFixed(2)} cashback from loyalty on this bill!`}
                  </p>
                </div>
              </div>
            )}
            {(bill.earnedPoints ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <TrendingUp className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {bill.earnNotYetApplied
                      ? `You will earn ${dynamicPointsEarn} points from loyalty when you finish (click Create Another Bill).`
                      : `You have earned ${bill.earnedPoints} points from loyalty on this bill!`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AMOUNT_SPENT / VISIT_MADE: show free item(s) they claimed (points → FREE_ITEM) */}
        {(bill.redeemedFreeItems?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/30">
            <Gift className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                Free item added to wallet
              </p>
              <p className="mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                {bill
                  .redeemedFreeItems!.map(
                    (item) => item.freeItemName ?? item.rewardName,
                  )
                  .join(", ")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Claim when served using &quot;Free items to claim&quot; below.
              </p>
            </div>
          </div>
        )}

        {/* Free items to claim (e.g. from referral) — claim after bill creation */}
        {(data.freeItems?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Gift className="size-4 text-purple-500" />
              Free items to claim
            </p>
            <div className="bg-muted/30 rounded-md border p-3">
              <ul className="space-y-2">
                {data.freeItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{item.skuName}</span>
                      {item.source !== "OTHER" && (
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          (
                          {item.source === "REFERRAL"
                            ? "Referral"
                            : item.source === "LOYALTY"
                              ? "Loyalty"
                              : item.source}
                          )
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={claimingId !== null}
                      onClick={() => handleClaimFreeItem(item.id)}
                    >
                      {claimingId === item.id ? "Claiming..." : "Claim"}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {redeemInfo?.tierInfo && (
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
            <Trophy className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-medium">
                Customer&apos;s tier: {redeemInfo.tierInfo.currentTierName}
              </p>
              <p className="text-muted-foreground text-xs">
                {redeemInfo.tierInfo.cashbackPercentage}% cashback
              </p>
            </div>
          </div>
        )}
        {redeemInfo?.loyaltyType === "TIER" &&
          !redeemInfo?.tierInfo &&
          redeemInfo?.tierMessage && (
            <div className="bg-muted/30 flex items-center gap-3 rounded-lg border border-amber-200 p-3 dark:border-amber-800">
              <Trophy className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-muted-foreground text-sm">
                {redeemInfo.tierMessage}
              </p>
            </div>
          )}

        {redeemInfo && alreadyRedeemedOnThisBill && (
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border border-amber-200 p-3 dark:border-amber-800">
            <Gift className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-muted-foreground text-sm">
              This bill has already used loyalty (this store or partner). Only
              one redemption per bill.
            </p>
          </div>
        )}

        {hasRedeemOptions && (
          <>
            <Separator />
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Gift className="text-primary size-6" />
                <h4 className="text-base font-semibold">
                  Use loyalty on this bill
                </h4>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose one: use balance at this store or from a partner. You can
                only apply one type per bill.
              </p>

              {/* Option 1: Balance at this store */}
              {canRedeemAtOurStore && redeemInfo && (
                <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    At this store
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {bill.earnNotYetApplied &&
                    ((bill.pendingCashbackEarn ?? 0) > 0 ||
                      (bill.pendingPointsEarn ?? 0) > 0)
                      ? isCashback
                        ? (() => {
                            const unlocked = redeemInfo.balance ?? 0;
                            const locked =
                              (redeemInfo.lockedCashback ?? 0) +
                              (redeemInfo.lockedReferralCashback ?? 0);
                            const pending = bill.pendingCashbackEarn ?? 0;
                            const lockedPart =
                              locked > 0
                                ? ` · ₹${locked.toFixed(2)} locked`
                                : "";
                            return `Available: ₹${unlocked.toFixed(2)} (unlocked)${lockedPart} + ₹${pending.toFixed(2)} from this bill (not redeemable until you finish). Max redeemable now: ₹${redeemInfo.maxRedeemable.toFixed(2)}`;
                          })()
                        : `Available: ₹${(redeemInfo.cashbackBalance ?? 0).toFixed(2)} cashback · ${redeemInfo.pointsBalance ?? 0} points + ${bill.pendingPointsEarn ?? 0} pts from this bill (not redeemable until you finish). Max on bill: ${redeemInfo.maxRedeemable} pts`
                      : isCashback
                        ? (() => {
                            const unlocked = redeemInfo.balance ?? 0;
                            const locked =
                              (redeemInfo.lockedCashback ?? 0) +
                              (redeemInfo.lockedReferralCashback ?? 0);
                            const lockedPart =
                              locked > 0
                                ? ` · ₹${locked.toFixed(2)} locked`
                                : "";
                            return `Available: ₹${unlocked.toFixed(2)} (unlocked)${lockedPart} · Max on this bill: ₹${redeemInfo.maxRedeemable.toFixed(2)}`;
                          })()
                        : `Cashback: ₹${(redeemInfo.cashbackBalance ?? 0).toFixed(2)} · Points: ${redeemInfo.pointsBalance ?? 0} (convert via reward below)`}
                  </p>
                  <div className="space-y-4">
                    {((isCashback && redeemInfo.maxRedeemable > 0) ||
                      (redeemInfo.maxRedeemableFromCashback ?? 0) > 0) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Cashback to apply (₹)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={
                              isCashback
                                ? redeemInfo.maxRedeemable
                                : (redeemInfo.maxRedeemableFromCashback ?? 0)
                            }
                            step={0.01}
                            placeholder="0.00"
                            value={redeemCashbackValue}
                            onChange={(e) =>
                              setRedeemCashbackValue(e.target.value)
                            }
                            disabled={redeeming}
                            className="h-11 flex-1 text-base"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="h-11 shrink-0 px-4 font-medium"
                            onClick={() => {
                              const max = isCashback
                                ? redeemInfo.maxRedeemable
                                : (redeemInfo.maxRedeemableFromCashback ?? 0);
                              setRedeemCashbackValue(max.toFixed(2));
                            }}
                            disabled={redeeming}
                          >
                            Max
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isCashback &&
                      (redeemInfo.maxRedeemableFromPoints ??
                        redeemInfo.maxRedeemable ??
                        0) > 0 && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Points to use
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={
                                  redeemInfo.maxRedeemableFromPoints ??
                                  redeemInfo.maxRedeemable ??
                                  0
                                }
                                step={1}
                                placeholder="0"
                                value={redeemPointsValue}
                                onChange={(e) =>
                                  setRedeemPointsValue(e.target.value)
                                }
                                disabled={redeeming}
                                className="h-11 flex-1 text-base"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="h-11 shrink-0 px-4 font-medium"
                                onClick={() => {
                                  const max =
                                    redeemInfo.maxRedeemableFromPoints ??
                                    redeemInfo.maxRedeemable ??
                                    0;
                                  setRedeemPointsValue(String(max));
                                }}
                                disabled={redeeming}
                              >
                                Max
                              </Button>
                            </div>
                          </div>
                          {redeemableRewards.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Or pick a reward
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {redeemableRewards.map((r) => (
                                  <Button
                                    key={r.id}
                                    type="button"
                                    variant={
                                      selectedRewardStageId === r.id
                                        ? "default"
                                        : "outline"
                                    }
                                    size="default"
                                    className="text-sm"
                                    onClick={() => {
                                      if (selectedRewardStageId === r.id) {
                                        setSelectedRewardStageId(null);
                                        setRedeemPointsValue("");
                                      } else {
                                        setSelectedRewardStageId(r.id);
                                        setRedeemPointsValue(
                                          String(r.pointsRequired),
                                        );
                                      }
                                    }}
                                  >
                                    {r.rewardName} ({r.pointsRequired} pts)
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    <Button
                      onClick={handleRedeem}
                      size="lg"
                      className="w-full"
                      disabled={
                        redeeming ||
                        (parseFloat(redeemCashbackValue || "0") <= 0 &&
                          !selectedRewardStageId)
                      }
                      loading={redeeming}
                    >
                      {selectedRewardStageId
                        ? "Convert points"
                        : parseFloat(redeemCashbackValue || "0") > 0
                          ? "Apply cashback to bill"
                          : "Redeem"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Option 2: Partner balance */}
              {canRedeemFromPartner && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    From partner
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Use balance from a partner business at this store. This
                    store&apos;s loyalty rules (min bill, max cap) apply.
                  </p>
                  <div className="space-y-4">
                    {data.partnerRedeemable.map((p) => {
                      const isPartnerCashback =
                        p.loyaltyType === "CASHBACK" ||
                        p.loyaltyType === "TIER";
                      const balanceLabel = isPartnerCashback
                        ? `₹${p.balance.toFixed(2)} cashback`
                        : `${p.balance} points`;
                      const maxPartnerDisplay = getMaxPartnerValue(p);
                      const value =
                        partnerRedeemValues[p.partnerBusinessId] ?? "";
                      const valueNum = isPartnerCashback
                        ? parseFloat(value) || 0
                        : Math.floor(parseInt(value, 10) || 0);
                      const isRedeeming =
                        redeemingPartnerId === p.partnerBusinessId;
                      const billUsedAnotherPartner =
                        bill.redeemedFromPartnerBusinessId != null &&
                        bill.redeemedFromPartnerBusinessId !==
                          p.partnerBusinessId;
                      const canUseThisPartner =
                        !billUsedAnotherPartner &&
                        (bill.redeemedFromPartnerBusinessId == null ||
                          bill.redeemedFromPartnerBusinessId ===
                            p.partnerBusinessId);
                      return (
                        <div
                          key={p.partnerBusinessId}
                          className="bg-muted/30 space-y-3 rounded-lg border p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">
                              {p.partnerBusinessName}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {isPartnerCashback
                                ? (() => {
                                    const locked =
                                      (p.lockedCashback ?? 0) +
                                      (p.lockedReferralCashback ?? 0);
                                    const lockedPart =
                                      locked > 0
                                        ? ` · ₹${locked.toFixed(2)} locked`
                                        : "";
                                    return `₹${p.balance.toFixed(2)} (unlocked)${lockedPart} at partner → ₹${p.valueAtCurrentStore.toFixed(2)} here · max ₹${p.maxRedeemableOnBill.toFixed(2)} on this bill`;
                                  })()
                                : `${balanceLabel} at partner → ₹${p.valueAtCurrentStore.toFixed(2)} here · max ₹${p.maxRedeemableOnBill.toFixed(2)} on this bill`}
                            </span>
                          </div>
                          {billUsedAnotherPartner ? (
                            <p className="text-muted-foreground text-sm">
                              One partner per bill. This bill already used
                              another partner.
                            </p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={maxPartnerDisplay}
                                step={isPartnerCashback ? 0.01 : 1}
                                placeholder={isPartnerCashback ? "0.00" : "0"}
                                value={value}
                                onChange={(e) =>
                                  setPartnerRedeemValues((prev) => ({
                                    ...prev,
                                    [p.partnerBusinessId]: e.target.value,
                                  }))
                                }
                                disabled={isRedeeming || !canUseThisPartner}
                                className="h-11 w-28"
                                aria-label={`Redeem from ${p.partnerBusinessName}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="h-11 shrink-0 px-4 font-medium"
                                onClick={() =>
                                  setPartnerRedeemValues((prev) => ({
                                    ...prev,
                                    [p.partnerBusinessId]:
                                      maxPartnerDisplay > 0
                                        ? isPartnerCashback
                                          ? maxPartnerDisplay.toFixed(2)
                                          : String(maxPartnerDisplay)
                                        : "",
                                  }))
                                }
                                disabled={
                                  isRedeeming ||
                                  maxPartnerDisplay <= 0 ||
                                  !canUseThisPartner
                                }
                              >
                                Max
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="default"
                                className="h-11"
                                onClick={() =>
                                  handlePartnerRedeem(p.partnerBusinessId)
                                }
                                disabled={
                                  isRedeeming ||
                                  !canUseThisPartner ||
                                  valueNum <= 0 ||
                                  valueNum > maxPartnerDisplay
                                }
                                loading={isRedeeming}
                              >
                                Apply to bill
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Button
          onClick={handleCreateAnother}
          className="w-full"
          size="lg"
          disabled={finalizing}
          loading={finalizing}
        >
          <ReceiptText className="mr-2 size-4" />
          {finalizing ? "Finishing…" : "Create Another Bill"}
        </Button>
      </CardContent>
    </Card>
  );
}
