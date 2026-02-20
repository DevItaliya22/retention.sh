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
import { useCallback, useEffect, useState } from "react";
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
}

interface FreeItemToClaim {
  id: string;
  skuId: string | null;
  skuName: string;
  source: string;
  createdAt: string;
}

interface RedeemInfoBill {
  id: string;
  billNumber: string;
  finalAmount: number | null;
  userPaidAmount: number | null;
  cashbackAmount: number | null;
  cashbackRedeemedAmount: number | null;
  earnedCashback?: number;
  earnedPoints?: number;
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
    freeItems: FreeItemToClaim[];
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

  const basePath = `/api/cashier/bills/${billId}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher<{
        bill: RedeemInfoBill;
        redeemInfo: RedeemInfo | null;
        freeItems?: FreeItemToClaim[];
        error?: string;
      }>(`${basePath}/redeem-info`);
      if (res.error) throw new Error(res.error);
      setData({
        bill: res.bill,
        redeemInfo: res.redeemInfo,
        freeItems: res.freeItems ?? [],
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

  const handleCreateAnother = () => {
    onCreateAnother();
    router.refresh();
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
  const alreadyRedeemedOnThisBill =
    redeemInfo?.alreadyRedeemedOnThisBill === true;
  const redeemableRewards =
    redeemInfo?.rewardStages?.filter((r) => r.canRedeem) ?? [];
  const hasRedeemOptions =
    redeemInfo &&
    !alreadyRedeemedOnThisBill &&
    (redeemInfo.maxRedeemable > 0 ||
      (redeemInfo.maxRedeemableFromCashback ?? 0) > 0 ||
      (redeemInfo.maxRedeemableFromPoints ?? 0) > 0 ||
      redeemableRewards.length > 0);

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

        <div className="bg-muted/40 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between text-base">
            <span className="text-muted-foreground font-medium">
              Amount to pay
            </span>
            <span className="text-lg font-semibold">
              ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {(bill.earnedCashback ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <Sparkles className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                You have earned ₹{(bill.earnedCashback ?? 0).toFixed(2)}{" "}
                cashback on this bill!
              </p>
            </div>
          </div>
        )}
        {(bill.earnedPoints ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <TrendingUp className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                You have earned {bill.earnedPoints} points on this bill!
              </p>
            </div>
          </div>
        )}

        {/* AMOUNT_SPENT / VISIT_MADE: show free item(s) they claimed (points → FREE_ITEM) */}
        {(bill.redeemedFreeItems?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/30">
            <Gift className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                Free item(s) claimed on this bill
              </p>
              <p className="mt-1 font-medium text-emerald-700 dark:text-emerald-300">
                {bill
                  .redeemedFreeItems!.map(
                    (item) => item.freeItemName ?? item.rewardName,
                  )
                  .join(", ")}
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
              This bill has already been redeemed. Redemption can only be done
              once per bill.
            </p>
          </div>
        )}

        {hasRedeemOptions && (
          <>
            <Separator />
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Gift className="text-primary size-6" />
                <h4 className="text-base font-semibold">Redeem on this bill</h4>
              </div>
              <p className="text-muted-foreground text-sm">
                {isCashback
                  ? `Available: ₹${(redeemInfo.balance ?? 0).toFixed(2)} · Max on this bill: ₹${redeemInfo.maxRedeemable.toFixed(2)}`
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
                        onChange={(e) => setRedeemCashbackValue(e.target.value)}
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
          </>
        )}

        <Button onClick={handleCreateAnother} className="w-full" size="lg">
          <ReceiptText className="mr-2 size-4" />
          Create Another Bill
        </Button>
      </CardContent>
    </Card>
  );
}
