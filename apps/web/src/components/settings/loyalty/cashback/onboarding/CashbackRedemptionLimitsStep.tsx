"use client";

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

export function CashbackRedemptionLimitsStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">
          Redemption limits on wallet balance
        </Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Cap how much of their cashback balance a customer can use at once.
        </p>
      </div>
      <FormField
        control={form.control}
        name="redemptionBalanceLimitEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-normal">
                  Limit redemption on wallet balance
                </span>
              </label>
            </FormControl>
          </FormItem>
        )}
      />
      {form.watch("redemptionBalanceLimitEnabled") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="redemptionBalanceLimitAmount"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Max redeemable (₹)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 500"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? null : Math.max(0, Number(v)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="redemptionBalanceLimitPercentage"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Max redeemable (% of balance)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="e.g. 50"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(
                        v === "" ? null : Math.min(100, Math.max(0, Number(v))),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="border-t pt-6">
        <Label className="text-sm font-medium">
          Redemption limits on bill amount
        </Label>
        <p className="text-muted-foreground mt-1 text-xs">
          Cap redemption relative to the current bill total.
        </p>
      </div>
      <FormField
        control={form.control}
        name="redemptionBillLimitEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                <span className="text-sm font-normal">
                  Limit redemption on bill amount
                </span>
              </label>
            </FormControl>
          </FormItem>
        )}
      />
      {form.watch("redemptionBillLimitEnabled") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="redemptionBillLimitAmount"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Max redeemable (₹)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 200"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? null : Math.max(0, Number(v)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="redemptionBillLimitPercentage"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Max redeemable (% of bill)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="e.g. 20"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(
                        v === "" ? null : Math.min(100, Math.max(0, Number(v))),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
