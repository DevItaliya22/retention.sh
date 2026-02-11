"use client";

import type { CreateBillResponse } from "@/hooks/cashier/useBillCreation";
import { useBillCreation } from "@/hooks/cashier/useBillCreation";
import { useCashierSkusQuery } from "@/hooks/cashier/useCashierSkusQuery";
import { useLoyaltyPreview } from "@/hooks/cashier/useLoyaltyPreview";
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
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Amount to pay</span>
            <span>
              ₹{(bill.userPaidAmount ?? bill.finalAmount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Loyalty Info */}
        {hasLoyalty && (
          <>
            <Separator />
            <div className="space-y-3">
              {/* Customer's tier (TIER type) — show name and range */}
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

              {/* Cashback / Tier earned (added to wallet) */}
              {isCashbackType && (loyalty?.earnedPoints ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <Sparkles className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                      ₹{loyalty!.earnedPoints} cashback earned!
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
                      +{loyalty!.earnedPoints} points earned!
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

  // ─── Form State ─────────────────────────────────────────────────────────
  const [billNumber, setBillNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [storeDiscount, setStoreDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
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
  const pointsBalance = loyaltyPreview?.pointsBalance ?? 0;
  const cashbackBalance = loyaltyPreview?.cashbackBalance ?? 0;

  const isCashbackType = loyaltyType === "CASHBACK" || loyaltyType === "TIER";
  const isPointsType =
    loyaltyType === "AMOUNT_SPENT" || loyaltyType === "VISIT_MADE";

  // Estimated amount user pays after loyalty (redeemed points/cashback reduce the bill).
  const redeemValue = Math.max(
    0,
    redeemPoints
      ? isCashbackType
        ? parseFloat(redeemPoints) || 0
        : parseInt(redeemPoints, 10) || 0
      : 0,
  );
  const estimatedUserPays = Math.max(0, finalAmountBeforeLoyalty - redeemValue);

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setBillNumber("");
    setPhoneNumber("");
    setName("");
    setAmount("");
    setStoreDiscount("");
    setNotes("");
    setPaymentMethod("");
    setLineItems([]);
    setRedeemPoints("");
    clearSelectedCustomer();
    setError(null);
    setShowSuggestions(false);
    setExtrasOpen(false);
    setShowSuccess(false);
    resetMutation();
  }, [clearSelectedCustomer, resetMutation]);

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

  // Show success state when bill created
  useEffect(() => {
    if (createSuccess && createData) {
      setShowSuccess(true);
    }
  }, [createSuccess, createData]);

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
    try {
      const parsedRedeemPoints = redeemPoints
        ? isPointsType
          ? Math.max(0, parseInt(redeemPoints, 10) || 0)
          : Math.max(0, parseFloat(redeemPoints) || 0)
        : 0;
      const validationResult = billFormSchema.safeParse({
        billNumber,
        phoneNumber,
        name: name || null,
        subtotal: subtotalForApi ?? undefined,
        storeDiscount: Math.max(0, discountAmount),
        tax: [],
        redeemPoints:
          isPointsType && redeemPoints ? parsedRedeemPoints : undefined,
        redeemCashback:
          isCashbackType && redeemPoints ? parsedRedeemPoints : undefined,
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

      const redeemVal = redeemPoints
        ? Math.max(
            0,
            isCashbackType
              ? parseFloat(redeemPoints) || 0
              : parseInt(redeemPoints, 10) || 0,
          )
        : 0;
      if (redeemVal > 0 && redeemVal > redeemablePoints) {
        const errorMessage = isCashbackType
          ? `Cannot redeem more than ₹${redeemablePoints.toFixed(2)} cashback.`
          : `Cannot redeem more than ${redeemablePoints} points.`;
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

  if (showSuccess && createData) {
    return (
      <div className="w-full max-w-md">
        <BillSuccessCard data={createData} onCreateAnother={handleReset} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Card>
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
                  disabled={isCreating || !!selectedCustomer}
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
              <Label htmlFor="storeDiscount">Store Discount</Label>
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
                className="w-full"
              />
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

                {/* Redeem points/cashback (loyalty) — only when applicable */}
                {loyaltyType !== "NONE" &&
                  phoneNumber.length >= 4 &&
                  redeemablePoints > 0 && (
                    <div className="space-y-1.5">
                      <Label htmlFor="redeemPoints">
                        {isCashbackType
                          ? `Redeem cashback (₹) — Balance: ₹${cashbackBalance.toFixed(2)}`
                          : "Redeem points (₹)"}
                      </Label>
                      <Input
                        id="redeemPoints"
                        variant="underline"
                        type="number"
                        min={0}
                        max={redeemablePoints}
                        step={isCashbackType ? 0.01 : 1}
                        placeholder="0"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(e.target.value)}
                        disabled={isCreating}
                        className="max-w-32"
                      />
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
                disabled={isCreating}
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
