"use client";

import {
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
  Switch,
  useFormContext,
} from "@reelo/ui/components";

export function CashbackConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="cashbackPercentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cashback percentage</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="5"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(
                    v === ""
                      ? undefined
                      : Math.min(100, Math.max(0, Number(v))),
                  );
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
        name="onFinalAmount"
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
            <div className="min-w-0 space-y-0.5">
              <FormLabel>Calculate cashback on final amount</FormLabel>
              <p className="text-muted-foreground max-w-md text-sm">
                After store discounts and tax
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maxCashbackCap"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max cashback per bill (₹)</FormLabel>
            <p className="text-muted-foreground mb-1 max-w-md text-sm">
              Leave empty for no cap
            </p>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder="No limit"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? null : Math.max(0, Number(v)));
                }}
                {...numericInputHandlers}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <MinPurchaseToggleField<LoyaltyProgramFormValues>
        enabledName="minPurchaseForEarningEnabled"
        valueName="minPurchaseForEarning"
        label="Min purchase for earning"
        valueLabel="Minimum amount for earning (₹)"
        placeholder="0"
      />
      <MinPurchaseToggleField<LoyaltyProgramFormValues>
        enabledName="minPurchaseForRedemptionEnabled"
        valueName="minPurchaseForRedemption"
        label="Min purchase for redemption"
        valueLabel="Minimum amount for redemption (₹)"
        placeholder="0"
      />

      <FormField
        control={form.control}
        name="allowSameBillRedemption"
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
            <div className="min-w-0 space-y-0.5">
              <FormLabel>Allow cashback on same bill</FormLabel>
              <p className="text-muted-foreground max-w-md text-sm">
                If off, cashback earned on this bill is available from the next
                bill only
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
