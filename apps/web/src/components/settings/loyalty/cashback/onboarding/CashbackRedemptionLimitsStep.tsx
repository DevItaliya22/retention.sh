"use client";

import { numericInputHandlers } from "@/components/settings/loyalty/common";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
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
    <div className="grid gap-4">
      {/* Wallet balance limit */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="redemptionBalanceLimitEnabled"
          render={({ field }) => (
            <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
              <div className="min-w-0 space-y-0.5">
                <FormLabel>Limit redemption on wallet balance</FormLabel>
                <p className="text-muted-foreground max-w-md text-sm">
                  Cap how much of their cashback balance a customer can use at
                  once
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
        {form.watch("redemptionBalanceLimitEnabled") && (
          <div className="flex flex-wrap items-end gap-3 pl-0">
            <Select
              value={
                form.watch("redemptionBalanceLimitAmount") != null
                  ? "AMOUNT"
                  : "PERCENTAGE"
              }
              onValueChange={(v) => {
                if (v === "AMOUNT") {
                  form.setValue("redemptionBalanceLimitPercentage", null);
                  form.setValue("redemptionBalanceLimitAmount", 0);
                } else {
                  form.setValue("redemptionBalanceLimitAmount", null);
                  form.setValue("redemptionBalanceLimitPercentage", 0);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">% of balance</SelectItem>
                <SelectItem value="AMOUNT">Amount (₹)</SelectItem>
              </SelectContent>
            </Select>
            {form.watch("redemptionBalanceLimitAmount") != null ? (
              <FormField
                control={form.control}
                name="redemptionBalanceLimitAmount"
                render={({ field }) => (
                  <FormItem className="mb-0 w-[120px]">
                    <FormLabel className="sr-only">Amount (₹)</FormLabel>
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
                  <FormItem className="mb-0 w-[120px]">
                    <FormLabel className="sr-only">Percentage</FormLabel>
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
        )}
      </div>

      {/* Bill amount limit */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="redemptionBillLimitEnabled"
          render={({ field }) => (
            <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
              <div className="min-w-0 space-y-0.5">
                <FormLabel>Limit redemption on bill amount</FormLabel>
                <p className="text-muted-foreground max-w-md text-sm">
                  Cap redemption relative to the current bill total
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
        {form.watch("redemptionBillLimitEnabled") && (
          <div className="flex flex-wrap items-end gap-3 pl-0">
            <Select
              value={
                form.watch("redemptionBillLimitAmount") != null
                  ? "AMOUNT"
                  : "PERCENTAGE"
              }
              onValueChange={(v) => {
                if (v === "AMOUNT") {
                  form.setValue("redemptionBillLimitPercentage", null);
                  form.setValue("redemptionBillLimitAmount", 0);
                } else {
                  form.setValue("redemptionBillLimitAmount", null);
                  form.setValue("redemptionBillLimitPercentage", 0);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">% of bill</SelectItem>
                <SelectItem value="AMOUNT">Amount (₹)</SelectItem>
              </SelectContent>
            </Select>
            {form.watch("redemptionBillLimitAmount") != null ? (
              <FormField
                control={form.control}
                name="redemptionBillLimitAmount"
                render={({ field }) => (
                  <FormItem className="mb-0 w-[120px]">
                    <FormLabel className="sr-only">Amount (₹)</FormLabel>
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
                  <FormItem className="mb-0 w-[120px]">
                    <FormLabel className="sr-only">Percentage</FormLabel>
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
        )}
      </div>
    </div>
  );
}
