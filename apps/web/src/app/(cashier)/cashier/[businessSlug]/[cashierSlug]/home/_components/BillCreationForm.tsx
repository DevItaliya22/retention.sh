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
  DateDisplay,
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

        {/* Amount Summary */}
        <div className="space-y-2 text-sm">
          {bill.amount != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bill Amount</span>
              <span className="font-medium">₹{bill.amount.toFixed(2)}</span>
            </div>
          )}
          {isCashbackType && (loyalty?.cashbackAmount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Cashback Earned</span>
              <span className="font-medium">
                -₹{(loyalty?.cashbackAmount ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          {(loyalty?.redeemedPoints ?? 0) > 0 && (
            <div className="flex justify-between text-blue-600 dark:text-blue-400">
              <span>Points Redeemed</span>
              <span className="font-medium">-₹{loyalty!.redeemedPoints}</span>
            </div>
          )}
          {bill.finalAmount != null && bill.amount !== bill.finalAmount && (
            <>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Final Amount</span>
                <span>₹{bill.finalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
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

              {/* Cashback / Tier earned */}
              {isCashbackType && (loyalty?.earnedPoints ?? 0) > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <Sparkles className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                      ₹{loyalty!.earnedPoints} cashback earned!
                    </p>
                    <p className="text-muted-foreground">
                      Balance: ₹{loyalty!.pointsBalance}
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
  const grossAmount = amount ? parseFloat(amount) : 0;
  const discountAmount = storeDiscount ? parseFloat(storeDiscount) : 0;
  const netAmount = Math.max(0, grossAmount - discountAmount);

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

  // ─── Loyalty Preview ────────────────────────────────────────────────────
  const loyaltyPreviewQuery = useLoyaltyPreview({
    businessId: business.id,
    phone: phoneNumber,
    billAmount: netAmount || 0,
    subtotal: computedSubtotal,
  });

  const loyaltyPreview = loyaltyPreviewQuery.data?.preview;
  const loyaltyType = loyaltyPreview?.loyaltyType ?? "NONE";
  const redeemablePoints = loyaltyPreview?.redeemablePoints ?? 0;
  const pointsBalance = loyaltyPreview?.pointsBalance ?? 0;

  const isCashbackType = loyaltyType === "CASHBACK" || loyaltyType === "TIER";
  const isPointsType =
    loyaltyType === "AMOUNT_SPENT" || loyaltyType === "VISIT_MADE";

  // Estimated final amount after loyalty
  // Only redeemed points/cashback reduce the current bill.
  // Earned cashback/points go to the wallet for future use.
  const redeemValue = redeemPoints ? parseInt(redeemPoints, 10) || 0 : 0;
  const estimatedFinal = Math.max(0, netAmount - redeemValue);

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

  // Customer search
  useEffect(() => {
    if (phoneNumber.length >= 4) {
      searchCustomers(phoneNumber);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [phoneNumber, searchCustomers]);

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

    try {
      const validationResult = billFormSchema.safeParse({
        billNumber,
        phoneNumber,
        name: name || null,
        amount: netAmount > 0 ? netAmount : null,
        redeemPoints: redeemPoints ? parseInt(redeemPoints, 10) : undefined,
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

      const redeemVal = redeemPoints ? parseInt(redeemPoints, 10) : 0;
      if (redeemVal > 0 && redeemVal > redeemablePoints) {
        const errorMessage = `Cannot redeem more than ${redeemablePoints} points.`;
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
            className="space-y-4"
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
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number *</Label>
              <Input
                id="billNumber"
                placeholder="BILL-001"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
                disabled={isCreating}
                autoComplete="off"
              />
            </div>

            {/* ─── Phone Number + Search ────────────────────────────────── */}
            <div className="relative space-y-2">
              <Label htmlFor="phoneNumber">Customer Phone Number *</Label>
              <div className="relative" ref={phoneInputRef}>
                <PhoneInput
                  id="phoneNumber"
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
              {isSearching && (
                <p className="text-muted-foreground text-sm">Searching...</p>
              )}
              {selectedCustomer && (
                <div className="bg-primary/10 border-primary/20 text-primary flex items-center gap-2 rounded-lg border p-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Selected: {selectedCustomer.name} (
                    {selectedCustomer.phoneNumber})
                  </span>
                </div>
              )}
            </div>

            {/* ─── Name ─────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
                autoComplete="nope"
              />
            </div>

            {/* ─── Amount + Store Discount ──────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDiscount">Store Discount</Label>
                <Input
                  id="storeDiscount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={storeDiscount}
                  onChange={(e) => setStoreDiscount(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* ─── Net Amount Display ───────────────────────────────────── */}
            {grossAmount > 0 && discountAmount > 0 && (
              <div className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Net Amount</span>
                <span className="font-semibold">₹{netAmount.toFixed(2)}</span>
              </div>
            )}

            {/* ─── Loyalty Section ──────────────────────────────────────── */}
            {loyaltyType !== "NONE" && phoneNumber.length >= 4 && (
              <div className="space-y-3 rounded-lg border p-4">
                {/* <p className="text-sm font-medium">Loyalty</p> */}

                {/* CASHBACK / TIER: only show redeem; actual cashback is shown after bill is created (from response) */}
                {isCashbackType && (
                  <div className="space-y-2">
                    Cashback (if any) shown in success state after bill is
                    created — message commented out
                    {pointsBalance === 0 && (
                      <p className="text-muted-foreground text-xs">
                        Cashback (if any) will be shown after the bill is
                        created.
                      </p>
                    )}
                    {pointsBalance > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Cashback Balance: ₹{pointsBalance}
                          </span>
                          <span className="text-muted-foreground">
                            Redeemable: ₹{redeemablePoints}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={redeemablePoints}
                            placeholder="Redeem ₹"
                            value={redeemPoints}
                            onChange={(e) => setRedeemPoints(e.target.value)}
                            disabled={isCreating}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AMOUNT_SPENT / VISIT_MADE: points + rewards */}
                {isPointsType && (
                  <div className="space-y-2">
                    {loyaltyType === "VISIT_MADE" &&
                      loyaltyPreview?.visitCount != null && (
                        <p className="text-muted-foreground text-xs">
                          Visits: {loyaltyPreview.visitCount}
                        </p>
                      )}

                    <div className="text-muted-foreground text-xs">
                      Points Balance: {pointsBalance}
                    </div>

                    {/* Available rewards */}
                    {(loyaltyPreview?.rewardStages ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground text-xs font-medium">
                          Rewards:
                        </p>
                        {loyaltyPreview!.rewardStages.map((stage) => (
                          <div
                            key={stage.id}
                            className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                              stage.canRedeem
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {stage.canRedeem && (
                                <Gift className="size-3 shrink-0" />
                              )}
                              {stage.rewardName}
                            </span>
                            <Badge
                              variant={stage.canRedeem ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {stage.pointsRequired} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Redeem points */}
                    {redeemablePoints > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-muted-foreground text-xs">
                          Redeemable: {redeemablePoints} pts (₹
                          {redeemablePoints} off)
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={redeemablePoints}
                          placeholder="Redeem points"
                          value={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.value)}
                          disabled={isCreating}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Expiring soon */}
                {loyaltyPreview?.expiringBuckets?.length ? (
                  <div className="text-muted-foreground space-y-0.5 text-xs">
                    <p className="font-medium">Expiring soon:</p>
                    {loyaltyPreview.expiringBuckets.map((bucket) => (
                      <p key={bucket.id}>
                        {bucket.remainingAmount} pts on{" "}
                        <DateDisplay date={bucket.expiresAt} />
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* ─── Final Amount Display ─────────────────────────────────── */}
            {netAmount > 0 && (
              <div className="bg-primary/5 border-primary/20 flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm font-medium">Estimated Final</span>
                <span className="text-lg font-bold">
                  ₹{estimatedFinal.toFixed(2)}
                </span>
              </div>
            )}

            {/* ─── Collapsible: Line Items, Notes, Payment ──────────────── */}
            <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-0"
                >
                  <span className="text-sm">
                    Additional Details (Notes, Line Items, Payment)
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform ${extrasOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentMethod || "__none__"}
                    onValueChange={(v) =>
                      setPaymentMethod(v === "__none__" ? "" : v)
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes for this bill"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isCreating}
                    rows={2}
                    className="resize-none"
                    autoComplete="off"
                  />
                </div>

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
