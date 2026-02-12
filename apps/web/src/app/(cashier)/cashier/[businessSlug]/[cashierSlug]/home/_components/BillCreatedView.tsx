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
import { CheckCircle2, Gift, ReceiptText, Trophy } from "lucide-react";
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
}

interface RedeemInfoBill {
  id: string;
  billNumber: string;
  finalAmount: number | null;
  userPaidAmount: number | null;
  cashbackAmount: number | null;
  cashbackRedeemedAmount: number | null;
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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemCashbackValue, setRedeemCashbackValue] = useState("");
  const [redeemPointsValue, setRedeemPointsValue] = useState("");
  const [selectedRewardStageId, setSelectedRewardStageId] = useState<
    string | null
  >(null);
  const [redeeming, setRedeeming] = useState(false);

  const basePath = `/api/cashier/bills/${billId}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher<{
        bill: RedeemInfoBill;
        redeemInfo: RedeemInfo | null;
        error?: string;
      }>(`${basePath}/redeem-info`);
      if (res.error) throw new Error(res.error);
      setData({ bill: res.bill, redeemInfo: res.redeemInfo });
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
    const pointsVal = Math.max(
      0,
      Math.floor(parseFloat(redeemPointsValue) || 0),
    );
    if (cashbackVal <= 0 && pointsVal <= 0) {
      toast.error("Enter cashback amount and/or points to redeem");
      return;
    }
    const maxCashback = isCashback
      ? data.redeemInfo.maxRedeemable
      : (data.redeemInfo.maxRedeemableFromCashback ?? 0);
    const maxPoints =
      data.redeemInfo.maxRedeemableFromPoints ??
      data.redeemInfo.maxRedeemable ??
      0;
    if (cashbackVal > maxCashback) {
      toast.error(
        `Cannot redeem more than ₹${maxCashback.toFixed(2)} cashback`,
      );
      return;
    }
    if (pointsVal > maxPoints) {
      toast.error(`Cannot redeem more than ${maxPoints} points`);
      return;
    }
    setRedeeming(true);
    try {
      const body: {
        redeemCashback?: number;
        redeemPoints?: number;
        rewardStageId?: string | null;
      } = {};
      if (cashbackVal > 0) body.redeemCashback = cashbackVal;
      if (pointsVal > 0) {
        body.redeemPoints = pointsVal;
        if (selectedRewardStageId) body.rewardStageId = selectedRewardStageId;
      }
      const res = await fetcher<{
        bill: object;
        loyalty: object;
        error?: string;
      }>(`${basePath}/redeem`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.error) throw new Error(res.error);
      toast.success("Redemption applied");
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
  const hasRedeemOptions =
    redeemInfo &&
    (redeemInfo.maxRedeemable > 0 ||
      (redeemInfo.maxRedeemableFromCashback ?? 0) > 0 ||
      (redeemInfo.maxRedeemableFromPoints ?? 0) > 0);
  const redeemableRewards =
    redeemInfo?.rewardStages?.filter((r) => r.canRedeem) ?? [];

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Bill Created Successfully</h3>
            <p className="text-muted-foreground text-sm">
              Bill #{bill.billNumber}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount to pay</span>
            <span className="font-semibold">
              ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

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

        {hasRedeemOptions && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gift className="size-4" />
                Redeem on this bill
              </div>
              <p className="text-muted-foreground text-xs">
                {isCashback
                  ? `Available: ₹${(redeemInfo.balance ?? 0).toFixed(2)} · Max redeemable: ₹${redeemInfo.maxRedeemable.toFixed(2)}`
                  : `Available cashback: ₹${(redeemInfo.cashbackBalance ?? 0).toFixed(2)} · Available points: ${redeemInfo.pointsBalance ?? 0} (from amount spent / visits)`}
              </p>
              <div className="space-y-2">
                {((isCashback && redeemInfo.maxRedeemable > 0) ||
                  (redeemInfo.maxRedeemableFromCashback ?? 0) > 0) && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 text-xs">
                      Cashback ₹
                    </span>
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
                      className="max-w-28"
                    />
                  </div>
                )}
                {!isCashback &&
                  (redeemInfo.maxRedeemableFromPoints ??
                    redeemInfo.maxRedeemable ??
                    0) > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-20 text-xs">
                          Points
                        </span>
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
                          onChange={(e) => setRedeemPointsValue(e.target.value)}
                          disabled={redeeming}
                          className="max-w-28"
                        />
                      </div>
                      {redeemableRewards.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Or use reward stage</Label>
                          <div className="flex flex-wrap gap-1">
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
                                className="text-xs"
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
                  disabled={
                    redeeming ||
                    (parseFloat(redeemCashbackValue || "0") <= 0 &&
                      parseFloat(redeemPointsValue || "0") <= 0)
                  }
                  loading={redeeming}
                >
                  Redeem
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
