"use client";

import { numericInputHandlers } from "@/components/settings/loyalty/common";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      <div className="pt-2">
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
      </div>
      {form.watch("redemptionBalanceLimitEnabled") && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Max redeemable</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={
                  form.watch("redemptionBalanceLimitAmount") != null
                    ? "AMOUNT"
                    : "PERCENTAGE"
                }
                onValueChange={(v) => {
                  if (v === "AMOUNT") {
                    form.setValue("redemptionBalanceLimitPercentage", null);
                  } else {
                    form.setValue("redemptionBalanceLimitAmount", null);
                  }
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">% of balance</SelectItem>
                  <SelectItem value="AMOUNT">Cashback (₹)</SelectItem>
                </SelectContent>
              </Select>
              {form.watch("redemptionBalanceLimitAmount") != null ? (
                <FormField
                  control={form.control}
                  name="redemptionBalanceLimitAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="e.g. 500"
                          className="max-w-32"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === "" ? null : Math.max(0, Number(v)),
                            );
                          }}
                          {...numericInputHandlers}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="redemptionBalanceLimitPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          placeholder="e.g. 50"
                          className="max-w-32"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === ""
                                ? null
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
              )}
            </div>
          </div>
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
      <div className="pt-2">
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
      </div>
      {form.watch("redemptionBillLimitEnabled") && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Max redeemable</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={
                  form.watch("redemptionBillLimitAmount") != null
                    ? "AMOUNT"
                    : "PERCENTAGE"
                }
                onValueChange={(v) => {
                  if (v === "AMOUNT") {
                    form.setValue("redemptionBillLimitPercentage", null);
                  } else {
                    form.setValue("redemptionBillLimitAmount", null);
                  }
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">% of bill</SelectItem>
                  <SelectItem value="AMOUNT">Cashback (₹)</SelectItem>
                </SelectContent>
              </Select>
              {form.watch("redemptionBillLimitAmount") != null ? (
                <FormField
                  control={form.control}
                  name="redemptionBillLimitAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="e.g. 200"
                          className="max-w-32"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === "" ? null : Math.max(0, Number(v)),
                            );
                          }}
                          {...numericInputHandlers}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="redemptionBillLimitPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          placeholder="e.g. 20"
                          className="max-w-32"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === ""
                                ? null
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
