"use client";

import { fetcher } from "@/lib/fetcher";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  Separator,
} from "@reelo/ui/components";
import {
  CheckCircle2,
  ChevronDown,
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
  tierMessage?: string | null;
  rewardStages: Array<{
    id: string;
    rewardName: string;
    rewardType: string;
    pointsRequired: number;
    canRedeem: boolean;
  }>;
  alreadyRedeemedOnThisBill?: boolean;
  lockedCashback?: number;
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
  redeemedFromPartnerBusinessId?: string | null;
  earnedCashback?: number;
  earnedPoints?: number;
  earnNotYetApplied?: boolean;
  pendingCashbackEarn?: number;
  pendingPointsEarn?: number;
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
  const [partnerRedeemValues, setPartnerRedeemValues] = useState<
    Record<string, string>
  >({});
  const [redeemingPartnerId, setRedeemingPartnerId] = useState<string | null>(
    null,
  );
  const [finalizing, setFinalizing] = useState(false);
  const [freeItemsOpen, setFreeItemsOpen] = useState(false);

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
    const isCashbackType =
      data.redeemInfo.loyaltyType === "CASHBACK" ||
      data.redeemInfo.loyaltyType === "TIER";
    const cashbackVal = Math.max(0, parseFloat(redeemCashbackValue) || 0);
    const wantsConvert = !isCashbackType && !!selectedRewardStageId;
    const wantsCashbackOnBill = cashbackVal > 0;

    if (!wantsConvert && !wantsCashbackOnBill) {
      toast.error(
        isCashbackType
          ? "Enter cashback amount to redeem"
          : "Select a reward to convert points, or enter cashback amount to apply to bill",
      );
      return;
    }

    const maxCashback = isCashbackType
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
        { method: "POST" },
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

  const getMaxPartnerValue = (p: PartnerRedeemableItem) => {
    const isCb = p.loyaltyType === "CASHBACK" || p.loyaltyType === "TIER";
    if (p.balance <= 0 || p.valueAtCurrentStore <= 0) return 0;
    if (isCb) return p.maxRedeemableOnBill;
    const raw = (p.maxRedeemableOnBill * p.balance) / p.valueAtCurrentStore;
    return Math.min(p.balance, Math.floor(raw));
  };

  const partnerInputToApiAmount = (
    p: PartnerRedeemableItem,
    inputValue: number,
  ) => {
    const isCb = p.loyaltyType === "CASHBACK" || p.loyaltyType === "TIER";
    if (!isCb) return inputValue;
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
        { method: "POST", body: JSON.stringify({ freeItemId }) },
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
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive text-sm">{error || "Bill not found"}</p>
        <Button
          variant="outline"
          className="mt-4"
          size="sm"
          onClick={handleCreateAnother}
        >
          Create Another Bill
        </Button>
      </div>
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
  const campaignRewardsToShow = data.campaignEarnings.filter(
    (campaign) =>
      campaign.rewardType === "FREE_ITEM" ||
      campaign.autoRedeemed > 0 ||
      campaign.earnedAmount > 0,
  );

  return (
    <div className="space-y-5">
      {/* ── Success header ── */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-muted-foreground text-xs font-medium">
          Bill #{bill.billNumber} created
        </p>
        <p className="font-mono text-3xl font-bold tracking-tight tabular-nums">
          ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
        </p>
        <p className="text-muted-foreground text-xs">Amount to pay</p>
      </div>

      {/* ── Bill breakdown ── */}
      {((bill.finalAmount ?? 0) > 0 &&
        (bill.campaignDiscountAmount ?? 0) > 0) ||
      (bill.partnerRedeemedAmount ?? 0) > 0 ? (
        <>
          <Separator />
          <div className="space-y-1.5 text-sm">
            {(bill.finalAmount ?? 0) > 0 &&
              (bill.campaignDiscountAmount ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bill total</span>
                  <span className="font-mono tabular-nums">
                    ₹{(bill.finalAmount ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
            {(bill.campaignDiscountAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>Campaign discount</span>
                <span className="font-mono tabular-nums">
                  -₹{(bill.campaignDiscountAmount ?? 0).toFixed(2)}
                </span>
              </div>
            )}
            {(bill.partnerRedeemedAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-violet-600 dark:text-violet-400">
                <span>Partner redeemed</span>
                <span className="font-mono tabular-nums">
                  -₹{(bill.partnerRedeemedAmount ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* ── Tier info ── */}
      {redeemInfo?.tierInfo && (
        <div className="flex items-start gap-2.5 border-l-2 border-l-amber-400 py-1.5 pl-3">
          <Trophy className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium">
              Tier: {redeemInfo.tierInfo.currentTierName}
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
          <div className="flex items-start gap-2.5 border-l-2 border-l-amber-400 py-1.5 pl-3">
            <Trophy className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-muted-foreground text-sm">
              {redeemInfo.tierMessage}
            </p>
          </div>
        )}

      {/* ── Already redeemed ── */}
      {redeemInfo && alreadyRedeemedOnThisBill && (
        <div className="flex items-start gap-2.5 border-l-2 border-l-amber-300 py-1.5 pl-3">
          <Gift className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-muted-foreground text-sm">
            Loyalty already used on this bill. One redemption per bill.
          </p>
        </div>
      )}

      {/* ── Redeem section ── */}
      {hasRedeemOptions && (
        <>
          <Separator />
          <div className="space-y-4">
            <p className="text-sm font-semibold">Use loyalty on this bill</p>

            {canRedeemAtOurStore && redeemInfo && (
              <div className="space-y-3 rounded-lg border border-dashed p-3">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  At this store
                </p>

                {(() => {
                  const locked =
                    (redeemInfo.lockedCashback ?? 0) +
                    (redeemInfo.lockedReferralCashback ?? 0);
                  return isCashback ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <span className="text-muted-foreground">Unlocked</span>
                      <span className="text-right font-mono font-medium tabular-nums">
                        ₹{(redeemInfo.balance ?? 0).toFixed(2)}
                      </span>
                      {locked > 0 && (
                        <>
                          <span className="text-muted-foreground">Locked</span>
                          <span className="text-muted-foreground text-right font-mono tabular-nums">
                            ₹{locked.toFixed(2)}
                          </span>
                        </>
                      )}
                      <span className="font-medium">Max on bill</span>
                      <span className="text-right font-mono font-semibold tabular-nums">
                        ₹{redeemInfo.maxRedeemable.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <span className="text-muted-foreground">Cashback</span>
                      <span className="text-right font-mono font-medium tabular-nums">
                        ₹{(redeemInfo.cashbackBalance ?? 0).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">Points</span>
                      <span className="text-right font-mono font-medium tabular-nums">
                        {redeemInfo.pointsBalance ?? 0}
                      </span>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {((isCashback && redeemInfo.maxRedeemable > 0) ||
                    (redeemInfo.maxRedeemableFromCashback ?? 0) > 0) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {isCashback ? "Cashback (₹)" : "Apply cashback (₹)"}
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
                          className="h-9 flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 shrink-0 px-3"
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
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Points</Label>
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
                              className="h-9 flex-1 text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 shrink-0 px-3"
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
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              Or pick a reward
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              {redeemableRewards.map((r) => (
                                <Button
                                  key={r.id}
                                  type="button"
                                  variant={
                                    selectedRewardStageId === r.id
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="h-7 text-xs"
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
                    size="sm"
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
                        ? "Apply cashback"
                        : "Redeem"}
                  </Button>
                </div>
              </div>
            )}

            {canRedeemFromPartner && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  From partner
                </p>
                {data.partnerRedeemable.map((p) => {
                  const isPartnerCashback =
                    p.loyaltyType === "CASHBACK" || p.loyaltyType === "TIER";
                  const maxPartnerDisplay = getMaxPartnerValue(p);
                  const value = partnerRedeemValues[p.partnerBusinessId] ?? "";
                  const valueNum = isPartnerCashback
                    ? parseFloat(value) || 0
                    : Math.floor(parseInt(value, 10) || 0);
                  const isRedeeming =
                    redeemingPartnerId === p.partnerBusinessId;
                  const billUsedAnotherPartner =
                    bill.redeemedFromPartnerBusinessId != null &&
                    bill.redeemedFromPartnerBusinessId !== p.partnerBusinessId;
                  const canUseThisPartner =
                    !billUsedAnotherPartner &&
                    (bill.redeemedFromPartnerBusinessId == null ||
                      bill.redeemedFromPartnerBusinessId ===
                        p.partnerBusinessId);
                  const partnerLocked =
                    (p.lockedCashback ?? 0) + (p.lockedReferralCashback ?? 0);
                  return (
                    <div
                      key={p.partnerBusinessId}
                      className="space-y-2.5 rounded-lg border border-dashed p-3"
                    >
                      <p className="text-sm font-medium">
                        {p.partnerBusinessName}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <span className="text-muted-foreground">Unlocked</span>
                        <span className="text-right font-mono font-medium tabular-nums">
                          {isPartnerCashback
                            ? `₹${p.balance.toFixed(2)}`
                            : `${p.balance} pts`}
                        </span>
                        {partnerLocked > 0 && (
                          <>
                            <span className="text-muted-foreground">
                              Locked
                            </span>
                            <span className="text-muted-foreground text-right font-mono tabular-nums">
                              ₹{partnerLocked.toFixed(2)}
                            </span>
                          </>
                        )}
                        <span className="font-medium">Max on bill</span>
                        <span className="text-right font-mono font-semibold tabular-nums">
                          ₹{p.maxRedeemableOnBill.toFixed(2)}
                        </span>
                      </div>
                      {billUsedAnotherPartner ? (
                        <p className="text-muted-foreground text-xs">
                          This bill already used another partner.
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
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
                            className="h-9 w-24 text-sm"
                            aria-label={`Redeem from ${p.partnerBusinessName}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 shrink-0 px-3"
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
                            size="sm"
                            className="h-9"
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
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bottom: Loyalty from this bill ── */}
      {((bill.earnedCashback ?? 0) > 0 || (bill.earnedPoints ?? 0) > 0) && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              From this bill
            </p>
            {(bill.earnedCashback ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="size-3.5 shrink-0 text-emerald-500" />
                <span>
                  ₹
                  {(bill.earnNotYetApplied
                    ? dynamicCashbackEarn
                    : (bill.earnedCashback ?? 0)
                  ).toFixed(2)}{" "}
                  cashback from this bill
                  {bill.earnNotYetApplied ? " (on finish)" : ""}
                </span>
              </div>
            )}
            {(bill.earnedPoints ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="size-3.5 shrink-0 text-blue-500" />
                <span>
                  {bill.earnNotYetApplied
                    ? dynamicPointsEarn
                    : bill.earnedPoints}{" "}
                  points from this bill
                  {bill.earnNotYetApplied ? " (on finish)" : ""}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bottom: Campaign rewards ── */}
      {campaignRewardsToShow.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
              Campaign rewards
            </p>
            {campaignRewardsToShow.map((c) => (
              <div
                key={c.campaignId}
                className="flex items-center gap-2 text-sm"
              >
                <Sparkles className="size-3.5 shrink-0 text-orange-500" />
                <span>
                  {c.rewardType === "FREE_ITEM"
                    ? (c.freeItemName ?? "Free item earned")
                    : c.autoRedeemed > 0
                      ? `₹${c.autoRedeemed.toFixed(2)} applied`
                      : c.earnedAmount > 0
                        ? `₹${c.earnedAmount.toFixed(2)} cashback earned`
                        : null}
                  {c.campaignTitle ? ` · ${c.campaignTitle}` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Bottom: Redeemed free items ── */}
      {(bill.redeemedFreeItems?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Gift className="size-3.5 shrink-0 text-emerald-500" />
          <span>
            Free item:{" "}
            {bill
              .redeemedFreeItems!.map(
                (item) => item.freeItemName ?? item.rewardName,
              )
              .join(", ")}
          </span>
        </div>
      )}

      {/* ── Bottom: Free items to claim (collapsible) ── */}
      {(data.freeItems?.length ?? 0) > 0 && (
        <Collapsible open={freeItemsOpen} onOpenChange={setFreeItemsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-1 text-sm font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Gift className="size-3.5 text-purple-500" />
                Free items to claim ({data.freeItems.length})
              </span>
              <ChevronDown
                className={`size-4 transition-transform ${freeItemsOpen ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {data.freeItems.map((item) => (
              <div
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
                  className="h-7 text-xs"
                  disabled={claimingId !== null}
                  onClick={() => handleClaimFreeItem(item.id)}
                >
                  {claimingId === item.id ? "Claiming..." : "Claim"}
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
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
    </div>
  );
}
