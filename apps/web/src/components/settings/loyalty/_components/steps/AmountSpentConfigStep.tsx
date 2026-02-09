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

export function AmountSpentConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="pointsPerRupee"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Points per rupee spent</Label>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder="1"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Math.max(0, Number(v)));
                }}
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
                  Earn points on final amount (after store discounts and tax)
                </span>
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="maxPointsPerPurchase"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">
              Max points per purchase — leave empty for no cap
            </Label>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="1"
                placeholder="No limit"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(
                    v === "" ? null : Math.max(0, parseInt(v, 10) || 0),
                  );
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
