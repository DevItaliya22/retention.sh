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

export function TierConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="pointsPerRupee"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Points per rupee spent (default)</Label>
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
