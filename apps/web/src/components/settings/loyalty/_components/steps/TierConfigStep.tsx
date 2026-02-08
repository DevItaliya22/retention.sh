"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import { MaxCapToggleField } from "../shared";

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
      <MaxCapToggleField<LoyaltyProgramFormValues>
        enabledName="maxCashbackCapEnabled"
        valueName="maxCashbackCap"
        label="Max cashback cap per transaction (global fallback)"
        placeholder="No limit"
      />
    </div>
  );
}
