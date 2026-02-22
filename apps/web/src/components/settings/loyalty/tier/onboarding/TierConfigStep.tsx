"use client";

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

export function TierConfigStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="pointsPerRupee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Points per rupee spent (default)</FormLabel>
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
          <FormItem className="border-input flex flex-row items-center justify-between border-b py-4">
            <div className="space-y-0.5">
              <FormLabel>Calculate cashback on final amount</FormLabel>
              <p className="text-muted-foreground text-sm">
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
        name="allowSameBillRedemption"
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between border-b py-4">
            <div className="space-y-0.5">
              <FormLabel>Use cashback on same bill</FormLabel>
              <p className="text-muted-foreground text-sm">
                If off, cashback is available from the next bill only
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
