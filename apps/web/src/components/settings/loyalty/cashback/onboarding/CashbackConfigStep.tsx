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
  FormMessage,
  Input,
  Label,
  Switch,
  useFormContext,
} from "@reelo/ui/components";

export function CashbackConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="cashbackPercentage"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Cashback percentage</Label>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="10"
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
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-normal">
                  Calculate cashback on final amount (after store discounts and
                  tax)
                </span>
              </label>
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
            <Label className="text-sm">
              Max cashback per bill (₹) — leave empty for no cap
            </Label>
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
        placeholder="0"
      />
      <MinPurchaseToggleField<LoyaltyProgramFormValues>
        enabledName="minPurchaseForRedemptionEnabled"
        valueName="minPurchaseForRedemption"
        label="Min purchase for redemption"
        placeholder="0"
      />
      <FormField
        control={form.control}
        name="allowSameBillRedemption"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-normal">
                  Allow customers to use cashback earned on this bill on the
                  same bill (if off, cashback is available from the next bill
                  only)
                </span>
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
