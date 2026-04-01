"use client";

import type { CreateBillResponse } from "@/hooks/cashier/useBillCreation";
import { useBillCreation } from "@/hooks/cashier/useBillCreation";
import { useCashierNextBillNumber } from "@/hooks/cashier/useCashierNextBillNumber";
import { useCashierSkusQuery } from "@/hooks/cashier/useCashierSkusQuery";
import {
  useLoyaltyPreview,
  type RewardStagePreview,
} from "@/hooks/cashier/useLoyaltyPreview";
import type { BillLineItemInput } from "@/lib/schemas/bill";
import { billFormSchema } from "@/lib/schemas/bill";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@reelo/ui/components";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Gift,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCashierContext } from "../_context/CashierContext";

interface LineItemRow {
  skuId: string;
  qty: string;
  unitPrice: string;
}

// ─── Success State ──────────────────────────────────────────────────────────

function BillSuccessCard({
  data,
  onCreateAnother,
}: {
  data: CreateBillResponse;
  onCreateAnother: () => void;
}) {
  const bill = data.bill;
  const loyalty = data.loyalty;
  const rewardStages = data.rewardStages ?? [];
  const campaignDiscount = data.campaignDiscount;

  if (!bill) return null;

  const hasLoyalty = loyalty && loyalty.loyaltyType !== "NONE";
  const isCashbackType =
    loyalty?.loyaltyType === "CASHBACK" || loyalty?.loyaltyType === "TIER";
  const isPointsType =
    loyalty?.loyaltyType === "AMOUNT_SPENT" ||
    loyalty?.loyaltyType === "VISIT_MADE";
  const wasUpgraded = loyalty?.tierUpgrade?.wasUpgraded ?? false;
  const redeemableRewards = rewardStages.filter((r) => r.canRedeem);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-5 p-6 sm:p-8">
        {/* Success Header */}
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

        {/* Bill structure: Subtotal → Store discount → Bill total → Cashback/Points redeemed → Amount to pay */}
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            Bill breakdown
          </p>
          {bill.subtotal != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{bill.subtotal.toFixed(2)}</span>
            </div>
          )}
          {(bill.storeDiscount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Store discount</span>
              <span className="font-medium">
                -₹{(bill.storeDiscount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          {bill.finalAmount != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bill total</span>
              <span className="font-medium">
                ₹{bill.finalAmount.toFixed(2)}
              </span>
            </div>
          )}
          {(bill.campaignDiscountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Campaign discount</span>
              <span className="font-medium">
                -₹{(bill.campaignDiscountAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          {isCashbackType &&
            (loyalty?.cashbackRedeemedAmount ??
              bill.cashbackRedeemedAmount ??
              0) > 0 && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>Cashback redeemed</span>
                <span className="font-medium">
                  -₹
                  {(
                    loyalty?.cashbackRedeemedAmount ??
                    bill.cashbackRedeemedAmount ??
                    0
                  ).toFixed(2)}
                </span>
              </div>
            )}
          {!isCashbackType && (loyalty?.redeemedPoints ?? 0) > 0 && (
            <div className="flex justify-between text-blue-600 dark:text-blue-400">
              <span>Points redeemed</span>
              <span className="font-medium">-₹{loyalty!.redeemedPoints}</span>
            </div>
          )}
          {(bill.partnerRedeemedAmount ?? 0) > 0 && (
            <div className="flex justify-between text-violet-600 dark:text-violet-400">
              <span>Partner balance redeemed</span>
              <span className="font-medium">
                -₹{(bill.partnerRedeemedAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Amount to pay</span>
            <span>
              ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Campaign Earnings */}
        {(campaignDiscount?.appliedCampaigns?.length ?? 0) > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Campaign rewards
              </p>
              {campaignDiscount!.appliedCampaigns.map((c) => (
                <div
                  key={c.campaignId}
                  className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20"
                >
                  <Sparkles className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
                  <div className="text-sm">
                    {c.rewardType === "FREE_ITEM" ? (
                      <p className="font-medium text-orange-700 dark:text-orange-300">
                        Free item earned: {c.freeItemName ?? "Free item"}
                      </p>
                    ) : c.discountAmount > 0 ? (
                      <p className="font-medium text-orange-700 dark:text-orange-300">
                        ₹{c.discountAmount.toFixed(2)} applied to this bill
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
          </>
        )}

        {/* Loyalty Info */}
        {hasLoyalty && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Loyalty rewards
              </p>
              {loyalty?.loyaltyType === "TIER" && loyalty?.currentTier && (
                <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
                  <Trophy className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="font-medium">
                      Customer&apos;s tier: {loyalty.currentTier.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {loyalty.currentTier.maxLifetimeSpend != null
                        ? `₹${loyalty.currentTier.minLifetimeSpend.toLocaleString()} – ₹${loyalty.currentTier.maxLifetimeSpend.toLocaleString()}`
                        : `₹${loyalty.currentTier.minLifetimeSpend.toLocaleString()}+`}{" "}
                      · {loyalty.currentTier.cashbackPercentage}% cashback
                    </p>
                  </div>
                </div>
              )}
              {loyalty?.loyaltyType === "TIER" &&
                !loyalty?.currentTier &&
                loyalty?.tierMessage && (
                  <div className="bg-muted/30 flex items-center gap-3 rounded-lg border border-amber-200 p-3 dark:border-amber-800">
                    <Trophy className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-muted-foreground text-sm">
                      {loyalty.tierMessage}
                    </p>
                  </div>
                )}

              {isCashbackType && (loyalty?.earnedPoints ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <Sparkles className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                      ₹{loyalty!.earnedPoints} cashback earned from loyalty!
                    </p>
                    <p className="text-muted-foreground">
                      New wallet balance: ₹{loyalty!.pointsBalance}
                    </p>
                  </div>
                </div>
              )}

              {/* Tier Upgrade */}
              {wasUpgraded && loyalty?.tierUpgrade && (
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <Trophy className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-300">
                      Tier Upgraded!{" "}
                      {loyalty.tierUpgrade.previousTierName && (
                        <>
                          {loyalty.tierUpgrade.previousTierName}{" "}
                          <ArrowUpRight className="inline size-3.5" />{" "}
                        </>
                      )}
                      {loyalty.tierUpgrade.newTierName}
                    </p>
                    <p className="text-muted-foreground">
                      Now earning {loyalty.tierUpgrade.newCashbackPercentage}%
                      cashback
                    </p>
                  </div>
                </div>
              )}

              {/* Points earned (AMOUNT_SPENT / VISIT_MADE) */}
              {isPointsType && (loyalty?.earnedPoints ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <TrendingUp className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      +{loyalty!.earnedPoints} points earned from loyalty!
                    </p>
                    <p className="text-muted-foreground">
                      Balance: {loyalty!.pointsBalance} points
                    </p>
                  </div>
                </div>
              )}

              {/* Available Rewards */}
              {isPointsType && redeemableRewards.length > 0 && (
                <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <Gift className="size-4" />
                    Available Rewards
                  </div>
                  <div className="space-y-1.5">
                    {redeemableRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{reward.rewardName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {reward.pointsRequired} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No rewards / no cashback explanation */}
              {isPointsType &&
                redeemableRewards.length === 0 &&
                (loyalty?.earnedPoints ?? 0) > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Keep earning points to unlock rewards!
                  </p>
                )}
            </div>
          </>
        )}

        <Button onClick={onCreateAnother} className="w-full" size="lg">
          <ReceiptText className="mr-2 size-4" />
          Create Another Bill
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────

export function BillCreationForm() {
  const router = useRouter();
  const { business } = useCashierContext();
  const {
    selectedCustomer,
    searchResults,
    isSearching,
    searchCustomers,
    handleCustomerSelect,
    clearSelectedCustomer,
    createBill,
    isCreating,
    createError,
    createSuccess,
    createData,
    resetMutation,
  } = useBillCreation(business.id);

  const { data: skusData } = useCashierSkusQuery();
  const skuOptions = skusData?.items ?? [];
  const { data: nextBillData, refetch: refetchNextBillNumber } =
    useCashierNextBillNumber();

  // ─── Form State ─────────────────────────────────────────────────────────
  const [billNumber, setBillNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [storeDiscount, setStoreDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [selectedRewardStageId, setSelectedRewardStageId] = useState<
    string | null
  >(null);
  const [redeemCashbackWallet, setRedeemCashbackWallet] = useState("");
  const [redeemFromPartnerId, setRedeemFromPartnerId] = useState<string | null>(
    null,
  );
  const [redeemPartnerValue, setRedeemPartnerValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLDivElement>(null);

  // ─── Computed Values ────────────────────────────────────────────────────
  // Subtotal = amount field or computed from line items. Store discount and tax (empty for now). Never negative.
  const grossAmount = Math.max(0, amount ? parseFloat(amount) : 0);
  const discountAmount = Math.max(
    0,
    storeDiscount ? parseFloat(storeDiscount) : 0,
  );

  const computedSubtotal = useMemo(() => {
    if (lineItems.length === 0) return null;
    let total = 0;
    for (const row of lineItems) {
      if (!row.skuId.trim()) continue;
      const qty = parseInt(row.qty, 10);
      if (Number.isNaN(qty) || qty < 1) continue;
      const unitPrice = row.unitPrice.trim()
        ? parseFloat(row.unitPrice)
        : (skuOptions.find((s) => s.id === row.skuId)?.price ?? 0);
      if (Number.isFinite(unitPrice)) total += qty * unitPrice;
    }
    return total > 0 ? total : null;
  }, [lineItems, skuOptions]);

  const subtotalValue = computedSubtotal ?? (grossAmount > 0 ? grossAmount : 0);
  const finalAmountBeforeLoyalty = Math.max(0, subtotalValue - discountAmount);

  // Validation: discount must be less than subtotal
  const discountInvalid =
    subtotalValue > 0 && discountAmount > 0 && discountAmount >= subtotalValue;

  // ─── Loyalty Preview ────────────────────────────────────────────────────
  const loyaltyPreviewQuery = useLoyaltyPreview({
    businessId: business.id,
    phone: phoneNumber,
    billAmount: finalAmountBeforeLoyalty || 0,
    subtotal: subtotalValue > 0 ? subtotalValue : null,
  });

  const loyaltyPreview = loyaltyPreviewQuery.data?.preview;
  const loyaltyType = loyaltyPreview?.loyaltyType ?? "NONE";
  const redeemablePoints = loyaltyPreview?.redeemablePoints ?? 0;
  const maxCashbackOnBill = loyaltyPreview?.maxRedeemableFromCashback ?? 0;
  const rewardStages = loyaltyPreview?.rewardStages ?? [];
  const partnerRedeemable = loyaltyPreview?.partnerRedeemable ?? [];

  const isStageUsableOnBill = useCallback(
    (r: RewardStagePreview) => {
      if (!r.canRedeem) return false;
      if (
        r.rewardType === "FREE_ITEM" &&
        r.minPurchaseForRedemptionEnabled &&
        r.minPurchaseForRedemption != null &&
        finalAmountBeforeLoyalty < r.minPurchaseForRedemption
      ) {
        return false;
      }
      if (
        (r.rewardType === "PERCENTAGE_DISCOUNT" ||
          r.rewardType === "CASH_DISCOUNT") &&
        finalAmountBeforeLoyalty <= 0
      ) {
        return false;
      }
      return true;
    },
    [finalAmountBeforeLoyalty],
  );

  const isCashbackType = loyaltyType === "CASHBACK" || loyaltyType === "TIER";
  const isPointsType =
    loyaltyType === "AMOUNT_SPENT" || loyaltyType === "VISIT_MADE";

  const selectedStage = selectedRewardStageId
    ? rewardStages.find((s) => s.id === selectedRewardStageId)
    : undefined;
  const useRewardStage = Boolean(
    selectedStage && isPointsType && isStageUsableOnBill(selectedStage),
  );

  const selectedPartner = redeemFromPartnerId
    ? partnerRedeemable.find((p) => p.partnerBusinessId === redeemFromPartnerId)
    : null;
  const isPartnerCashbackType =
    selectedPartner &&
    (selectedPartner.loyaltyType === "CASHBACK" ||
      selectedPartner.loyaltyType === "TIER");
  const partnerRedeemVal = Math.max(
    0,
    redeemPartnerValue
      ? isPartnerCashbackType
        ? parseFloat(redeemPartnerValue) || 0
        : parseInt(redeemPartnerValue, 10) || 0
      : 0,
  );
  // For partner CASHBACK/TIER: input is "discount at this store" (₹). For points: input is partner points.
  const effectivePartnerDiscount =
    selectedPartner && selectedPartner.balance > 0
      ? isPartnerCashbackType
        ? Math.min(
            partnerRedeemVal,
            selectedPartner.maxRedeemableOnBill,
            finalAmountBeforeLoyalty,
          )
        : Math.min(
            (partnerRedeemVal / selectedPartner.balance) *
              selectedPartner.valueAtCurrentStore,
            selectedPartner.maxRedeemableOnBill,
            finalAmountBeforeLoyalty,
          )
      : 0;
  const maxPartnerRedeemValue = selectedPartner
    ? isPartnerCashbackType
      ? selectedPartner.maxRedeemableOnBill
      : selectedPartner.balance > 0 && selectedPartner.valueAtCurrentStore > 0
        ? Math.min(
            selectedPartner.balance,
            (selectedPartner.maxRedeemableOnBill /
              selectedPartner.valueAtCurrentStore) *
              selectedPartner.balance,
          )
        : 0
    : 0;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhoneNumber("");
    setName("");
    setAmount("");
    setStoreDiscount("");
    setNotes("");
    setPaymentMethod("");
    setLineItems([]);
    setRedeemPoints("");
    setSelectedRewardStageId(null);
    setRedeemCashbackWallet("");
    setRedeemFromPartnerId(null);
    setRedeemPartnerValue("");
    clearSelectedCustomer();
    setError(null);
    setShowSuggestions(false);
    setExtrasOpen(false);
    resetMutation();
    refetchNextBillNumber().then((result) => {
      const next =
        result.data?.nextBillNumber != null && result.data.nextBillNumber >= 1
          ? String(result.data.nextBillNumber)
          : "";
      setBillNumber(next);
    });
  }, [clearSelectedCustomer, resetMutation, refetchNextBillNumber]);

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { skuId: "", qty: "1", unitPrice: "" }]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLineItem = useCallback(
    (index: number, field: keyof LineItemRow, value: string) => {
      setLineItems((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  const phoneDigitCount = phoneDigits.length;

  // Customer search when 4+ digits
  useEffect(() => {
    if (phoneDigitCount >= 4) {
      searchCustomers(phoneNumber);
    } else {
      setShowSuggestions(false);
    }
  }, [phoneNumber, phoneDigitCount, searchCustomers]);

  const last10Digits = phoneDigits.slice(-10);

  // Show suggestions only when 4–9 digits (still typing); hide when full number (10+)
  useEffect(() => {
    if (
      phoneDigitCount >= 4 &&
      phoneDigitCount < 10 &&
      searchResults.length > 0
    ) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [phoneDigitCount, searchResults.length]);

  // When full number (10+ digits, e.g. +919925122114) and exactly one match: auto-fill name
  useEffect(() => {
    const result = searchResults[0];
    if (
      phoneDigitCount >= 10 &&
      searchResults.length === 1 &&
      result &&
      !selectedCustomer
    ) {
      const resultLast10 = (result.phoneNumber ?? "")
        .replace(/\D/g, "")
        .slice(-10);
      if (resultLast10.length >= 10 && resultLast10 === last10Digits) {
        handleCustomerSelect(result);
        setShowSuggestions(false);
      }
    }
  }, [
    phoneDigitCount,
    last10Digits,
    searchResults,
    selectedCustomer,
    handleCustomerSelect,
  ]);

  // Auto-fill name from selected customer
  useEffect(() => {
    if (selectedCustomer) {
      setName(selectedCustomer.name || "");
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (!selectedRewardStageId) return;
    const st = rewardStages.find((s) => s.id === selectedRewardStageId);
    if (!st || !isStageUsableOnBill(st)) {
      setSelectedRewardStageId(null);
      setRedeemPoints("");
    }
  }, [selectedRewardStageId, rewardStages, isStageUsableOnBill]);

  // Auto-fill bill number from business nextBillNumber
  useEffect(() => {
    if (
      nextBillData?.nextBillNumber != null &&
      nextBillData.nextBillNumber >= 1
    ) {
      setBillNumber(String(nextBillData.nextBillNumber));
    }
  }, [nextBillData?.nextBillNumber]);

  // Navigate to billCreated URL when bill created (enables redeem options view)
  useEffect(() => {
    if (createSuccess && createData?.bill?.id) {
      const params = new URLSearchParams(window.location.search);
      params.set("billCreated", createData.bill.id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
      router.refresh();
    }
  }, [createSuccess, createData, router]);

  useEffect(() => {
    if (createError) {
      const errorMsg = getErrorMessageFromResponse(
        createError,
        "Failed to create bill. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }, [createError]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        phoneInputRef.current &&
        !phoneInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse and merge line items by skuId
    const bySku = new Map<string, { qty: number; unitPrice?: number }>();
    for (const row of lineItems) {
      if (!row.skuId.trim()) continue;
      const qty = parseInt(row.qty, 10);
      if (Number.isNaN(qty) || qty < 1) continue;
      const rawPrice = row.unitPrice.trim();
      const unitPrice =
        rawPrice && !Number.isNaN(parseFloat(rawPrice))
          ? parseFloat(rawPrice)
          : undefined;
      const existing = bySku.get(row.skuId);
      if (existing) {
        existing.qty += qty;
        if (unitPrice != null) existing.unitPrice = unitPrice;
      } else {
        bySku.set(row.skuId, { qty, unitPrice });
      }
    }
    const parsedLineItems: BillLineItemInput[] = Array.from(
      bySku.entries(),
    ).map(([skuId, { qty, unitPrice }]) => ({ skuId, qty, unitPrice }));

    const subtotalForApi =
      computedSubtotal ?? (grossAmount > 0 ? grossAmount : null);
    if (!subtotalForApi || subtotalForApi <= 0) {
      setError("Amount or line items with total are required.");
      toast.error("Amount or line items with total are required.");
      return;
    }
    if (discountAmount >= subtotalForApi) {
      setError("Store discount must be less than subtotal.");
      toast.error("Store discount must be less than subtotal.");
      return;
    }
    try {
      const maxWalletCb = Math.min(maxCashbackOnBill, finalAmountBeforeLoyalty);
      const parsedWalletCashback = Math.max(
        0,
        parseFloat(redeemCashbackWallet) || 0,
      );
      if (isPointsType && parsedWalletCashback > maxWalletCb + 0.001) {
        const errorMessage = `Cannot apply more than ₹${maxWalletCb.toFixed(2)} cashback on this bill.`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const parsedRedeemPartnerInput =
        redeemPartnerValue && selectedPartner
          ? isPartnerCashbackType
            ? Math.max(0, parseFloat(redeemPartnerValue) || 0)
            : Math.max(0, parseInt(redeemPartnerValue, 10) || 0)
          : 0;
      // For partner CASHBACK/TIER: input is discount at this store (₹); convert to partner amount for API
      const parsedRedeemPartner =
        !selectedPartner || parsedRedeemPartnerInput <= 0
          ? 0
          : isPartnerCashbackType
            ? Math.min(
                selectedPartner.balance,
                Math.floor(
                  ((parsedRedeemPartnerInput * selectedPartner.balance) /
                    selectedPartner.valueAtCurrentStore) *
                    100,
                ) / 100,
              )
            : parsedRedeemPartnerInput;

      const cappedWalletCashback =
        isPointsType && parsedWalletCashback > 0
          ? Math.min(parsedWalletCashback, maxWalletCb)
          : 0;
      const cashbackFromMainField = isCashbackType
        ? Math.max(0, parseFloat(redeemPoints) || 0)
        : 0;
      const pointsFromMainField =
        isPointsType && !useRewardStage
          ? Math.max(0, parseInt(redeemPoints, 10) || 0)
          : 0;
      const pointsForApi =
        isPointsType && useRewardStage && selectedStage
          ? selectedStage.pointsRequired
          : isPointsType && pointsFromMainField > 0
            ? pointsFromMainField
            : undefined;
      const redeemCashbackForApi =
        isCashbackType && cashbackFromMainField > 0
          ? cashbackFromMainField
          : isPointsType && cappedWalletCashback > 0
            ? cappedWalletCashback
            : undefined;

      const validationResult = billFormSchema.safeParse({
        billNumber,
        phoneNumber,
        name: name || null,
        subtotal: subtotalForApi ?? undefined,
        storeDiscount: Math.max(0, discountAmount),
        tax: [],
        redeemPoints: pointsForApi,
        redeemCashback: redeemCashbackForApi,
        rewardStageId:
          isPointsType && useRewardStage && selectedRewardStageId
            ? selectedRewardStageId
            : null,
        redeemFromPartnerBusinessId:
          redeemFromPartnerId && parsedRedeemPartner > 0
            ? redeemFromPartnerId
            : undefined,
        redeemPartnerCashback:
          selectedPartner && isPartnerCashbackType && parsedRedeemPartner > 0
            ? parsedRedeemPartner
            : undefined,
        redeemPartnerPoints:
          selectedPartner && !isPartnerCashbackType && parsedRedeemPartner > 0
            ? parsedRedeemPartner
            : undefined,
        notes: notes.trim() || undefined,
        paymentMethod: paymentMethod.trim() || undefined,
        lineItems: parsedLineItems.length > 0 ? parsedLineItems : undefined,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const errorMessage = firstError?.message || "Invalid input";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (
        isCashbackType &&
        cashbackFromMainField > 0 &&
        cashbackFromMainField > redeemablePoints + 0.001
      ) {
        const errorMessage = `Cannot redeem more than ₹${redeemablePoints.toFixed(2)} cashback.`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      if (
        isPointsType &&
        !useRewardStage &&
        pointsFromMainField > 0 &&
        pointsFromMainField > redeemablePoints
      ) {
        const errorMessage = `Cannot redeem more than ${redeemablePoints} points.`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      const partnerInputForMaxCheck = isPartnerCashbackType
        ? parsedRedeemPartnerInput
        : parsedRedeemPartner;
      if (
        selectedPartner &&
        partnerInputForMaxCheck > 0 &&
        partnerInputForMaxCheck > maxPartnerRedeemValue
      ) {
        const errorMessage = isPartnerCashbackType
          ? `Cannot redeem more than ₹${maxPartnerRedeemValue.toFixed(2)} on this bill from ${selectedPartner.partnerBusinessName}.`
          : `Cannot redeem more than ${Math.floor(maxPartnerRedeemValue)} points from ${selectedPartner.partnerBusinessName}.`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      await createBill(validationResult.data);
    } catch (err: any) {
      const errorMsg = getErrorMessageFromResponse(
        err,
        "An unexpected error occurred. Please try again.",
      );
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  // Success state: navigates to ?billCreated=billId; BillCreatedView handles display
  return (
    <div className="w-full max-w-md">
      <Card className="border-0 shadow-none">
        <CardContent className="p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Create Bill</h2>
          {error && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-center text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            autoComplete="off"
          >
            {/* Hidden input to discourage browser autocomplete */}
            <input
              type="text"
              autoComplete="off"
              name="prevent_autofill"
              tabIndex={-1}
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden
              readOnly
            />

            {/* ─── Bill Number ──────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="billNumber">Bill Number *</Label>
              <Input
                id="billNumber"
                variant="underline"
                placeholder="BILL-001"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
                disabled={isCreating}
                autoComplete="off"
              />
            </div>

            {/* ─── Phone Number + Search ────────────────────────────────── */}
            <div className="relative space-y-1.5">
              <Label htmlFor="phoneNumber">Customer Phone *</Label>
              <div className="relative" ref={phoneInputRef}>
                <PhoneInput
                  id="phoneNumber"
                  variant="underline"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(value: string) => {
                    setPhoneNumber(value.toString());
                    clearSelectedCustomer();
                  }}
                  required
                  disabled={isCreating}
                  autoComplete="nope"
                  defaultCountry="IN"
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSelectedCustomer();
                      setPhoneNumber("");
                    }}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 z-10 -translate-y-1/2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showSuggestions && searchResults.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md"
                >
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        handleCustomerSelect(customer);
                        setShowSuggestions(false);
                      }}
                      className="hover:bg-accent focus:bg-accent w-full px-4 py-2 text-left focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {customer.phoneNumber}
                          </div>
                        </div>
                        {customer.isBusinessCustomer && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                            This Business
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Name ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                variant="underline"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
                autoComplete="nope"
              />
            </div>

            {/* ─── Subtotal (full line) ──────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Subtotal</Label>
              <Input
                id="amount"
                variant="underline"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isCreating}
                className="w-full"
              />
            </div>

            {/* ─── Store discount (full line) ─────────────────────────────── */}
            <div className="space-y-1.5">
              <Label
                htmlFor="storeDiscount"
                className={discountInvalid ? "text-destructive" : undefined}
              >
                Store Discount
              </Label>
              <Input
                id="storeDiscount"
                variant="underline"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={storeDiscount}
                onChange={(e) => setStoreDiscount(e.target.value)}
                disabled={isCreating}
                className={`w-full ${discountInvalid ? "border-destructive text-destructive focus-visible:ring-destructive" : ""}`}
              />
              {discountInvalid && (
                <p className="text-destructive text-sm">
                  Discount must be less than subtotal (₹
                  {subtotalValue.toFixed(2)}).
                </p>
              )}
            </div>

            {/* ─── Bill total (full line, disabled) ──────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="billTotal">Bill total</Label>
              <Input
                id="billTotal"
                variant="underline"
                type="text"
                readOnly
                disabled
                value={
                  subtotalValue > 0
                    ? `₹${finalAmountBeforeLoyalty.toFixed(2)}`
                    : "—"
                }
                className="w-full cursor-default"
              />
            </div>

            {/* ─── Payment method buttons (equal width, full row) ─────────── */}
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="flex w-full gap-2">
                {(
                  [
                    { value: "card", label: "Card" },
                    { value: "cash", label: "Cash" },
                    { value: "upi", label: "UPI" },
                    { value: "other", label: "Other" },
                  ] as const
                ).map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={paymentMethod === value ? "default" : "outline"}
                    size="sm"
                    className="min-w-0 flex-1"
                    onClick={() => setPaymentMethod(value)}
                    disabled={isCreating}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tier/cashback % is shown only after bill is created (BillCreatedView), not during creation, to avoid flicker */}

            {/* ─── Collapsible: Notes, Line Items, Redeem points ─────────── */}
            <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-0"
                >
                  <span className="text-sm">
                    Additional Details (Notes, Line Items)
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform ${extrasOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    variant="underline"
                    placeholder="Any notes for this bill"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isCreating}
                    rows={2}
                    className="resize-none"
                    autoComplete="off"
                  />
                </div>

                {/* Redeem from partner (them → you) — when customer has balance at a partner */}
                {partnerRedeemable.length > 0 && phoneNumber.length >= 4 && (
                  <div className="space-y-2 rounded-lg border border-dashed p-3">
                    <Label className="text-sm font-medium">
                      Redeem from partner
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Use points/cashback from a partner business at this store.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={redeemFromPartnerId ?? "__none__"}
                        onValueChange={(v) => {
                          setRedeemFromPartnerId(v === "__none__" ? null : v);
                          setRedeemPartnerValue("");
                        }}
                        disabled={isCreating}
                      >
                        <SelectTrigger className="max-w-[200px]">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            No partner redemption
                          </SelectItem>
                          {partnerRedeemable.map((p) => (
                            <SelectItem
                              key={p.partnerBusinessId}
                              value={p.partnerBusinessId}
                            >
                              {p.partnerBusinessName} — ₹
                              {p.valueAtCurrentStore.toFixed(2)} available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPartner && (
                        <div className="flex items-center gap-2">
                          <Input
                            variant="underline"
                            type="number"
                            min={0}
                            max={maxPartnerRedeemValue}
                            step={isPartnerCashbackType ? 0.01 : 1}
                            placeholder="0"
                            value={redeemPartnerValue}
                            onChange={(e) =>
                              setRedeemPartnerValue(e.target.value)
                            }
                            disabled={isCreating}
                            className="max-w-28"
                            aria-label="Partner redeem amount"
                          />
                          <span className="text-muted-foreground text-xs">
                            {isPartnerCashbackType ? "₹" : "pts"} (≈ ₹
                            {effectivePartnerDiscount.toFixed(2)} off)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Line Items</Label>
                      <p className="text-muted-foreground text-sm">
                        Add SKUs and quantities
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLineItem}
                      disabled={isCreating || skuOptions.length === 0}
                      className="gap-2"
                    >
                      <Plus className="size-4" />
                      Add item
                    </Button>
                  </div>
                  {skuOptions.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No SKUs set up yet.
                    </p>
                  )}
                  {lineItems.length > 0 && (
                    <div className="space-y-3">
                      {lineItems.map((row, index) => (
                        <div
                          key={index}
                          className="bg-muted/30 flex flex-wrap items-end gap-3 rounded-md border p-3"
                        >
                          <div className="min-w-[180px] flex-1 space-y-2">
                            <Label className="text-xs">SKU</Label>
                            <Select
                              value={row.skuId || "__none__"}
                              onValueChange={(v) =>
                                updateLineItem(
                                  index,
                                  "skuId",
                                  v === "__none__" ? "" : v,
                                )
                              }
                              disabled={isCreating}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select SKU" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">
                                  Select SKU
                                </SelectItem>
                                {skuOptions.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.sku} — {s.name}
                                    {s.price != null
                                      ? ` (₹${s.price.toFixed(2)})`
                                      : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24 space-y-2">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              variant="underline"
                              type="number"
                              min={1}
                              value={row.qty}
                              onChange={(e) =>
                                updateLineItem(index, "qty", e.target.value)
                              }
                              disabled={isCreating}
                              placeholder="1"
                            />
                          </div>
                          <div className="w-28 space-y-2">
                            <Label className="text-xs">Unit price</Label>
                            <Input
                              variant="underline"
                              type="number"
                              step="0.01"
                              min={0}
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateLineItem(
                                  index,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                              disabled={isCreating}
                              placeholder="—"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                            disabled={isCreating}
                            aria-label="Remove line item"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* ─── Actions ──────────────────────────────────────────────── */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                loading={isCreating}
                className="flex-1"
                disabled={isCreating || discountInvalid}
              >
                {isCreating ? "Creating..." : "Create Bill"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isCreating}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
