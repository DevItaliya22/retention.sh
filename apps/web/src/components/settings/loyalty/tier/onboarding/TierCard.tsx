"use client";

import {
  MaxCapToggleField,
  MinPurchaseToggleField,
  numericInputHandlers,
} from "@/components/settings/loyalty/common";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useFormContext,
} from "@reelo/ui/components";

interface TierCardProps {
  index: number;
  isTopTier?: boolean;
}

export function TierCard({ index, isTopTier = false }: TierCardProps) {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const prefix = `tiers.${index}` as const;
  const minLifetimeSpend = form.watch(`${prefix}.minLifetimeSpend`) ?? 0;

  return (
    <section className="space-y-4">
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tier name</FormLabel>
              <FormControl>
                <Input
                  variant="underline"
                  placeholder="e.g. Silver, Gold, Platinum"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.rank`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank (1 = lowest)</FormLabel>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(1);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(1, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.cashbackPercentage`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashback %</FormLabel>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="5"
                  value={
                    field.value === undefined ||
                    field.value === null ||
                    field.value === 0
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(5);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n))
                      field.onChange(Math.min(100, Math.max(0, n)));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.minLifetimeSpend`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min lifetime spend (₹)</FormLabel>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={
                    field.value === undefined ||
                    field.value === null ||
                    field.value === 0
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(0);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(0, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.maxLifetimeSpend`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max lifetime spend (₹)</FormLabel>
              {isTopTier && (
                <p className="text-muted-foreground mb-1 max-w-md text-sm">
                  Leave empty — all customers with spend ≥ ₹
                  {Number(minLifetimeSpend).toLocaleString()} will be in this
                  tier.
                </p>
              )}
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={isTopTier ? "No limit" : "e.g. 5000"}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(null);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(0, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <MinPurchaseToggleField<LoyaltyProgramFormValues>
          enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
          valueName={`${prefix}.minPurchaseForRedemption`}
          label="Min purchase for redemption"
          valueLabel="Minimum amount for redemption (₹)"
          placeholder="0"
        />
        <MaxCapToggleField<LoyaltyProgramFormValues>
          enabledName={`${prefix}.maxCashbackCapEnabled`}
          valueName={`${prefix}.maxCashbackCap`}
          label="Max cashback cap per transaction"
          valueLabel="Max amount (₹)"
          placeholder="No limit"
        />
      </div>
    </section>
  );
}
