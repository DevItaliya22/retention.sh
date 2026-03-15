"use client";

import type { LoyaltyRewardType } from "@/lib/schemas/loyalty";
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
import { MaxCapToggleField } from "./MaxCapToggleField";
import { MinPurchaseToggleField } from "./MinPurchaseToggleField";
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

const REWARD_TYPES: { value: LoyaltyRewardType; label: string }[] = [
  { value: "FREE_ITEM", label: "Free item" },
  { value: "PERCENTAGE_DISCOUNT", label: "% discount" },
  { value: "CASH_DISCOUNT", label: "Cash discount" },
];

interface RewardStageFieldsSectionProps {
  index: number;
}

export function RewardStageFieldsSection({
  index,
}: RewardStageFieldsSectionProps) {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const prefix = `rewardStages.${index}` as const;
  const rewardType = form.watch(`${prefix}.rewardType`) as LoyaltyRewardType;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${prefix}.pointsRequired`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Points required</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  placeholder="e.g. 5000"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(
                      v === "" ? undefined : Math.max(0, Number(v)),
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.rewardName`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Reward name (display)</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  placeholder="e.g. 10% off on entire purchase"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.rewardType`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Reward type</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <div className="flex flex-wrap gap-4">
                {REWARD_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      checked={field.value === t.value}
                      onChange={() => field.onChange(t.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{t.label}</span>
                  </label>
                ))}
              </div>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {rewardType === "FREE_ITEM" && (
        <FormField
          control={form.control}
          name={`${prefix}.freeItemName`}
          render={({ field }) => (
            <FormItem className={SETTINGS_ROW_CLASS}>
              <div className={SETTINGS_LABEL_CLASS}>
                <FormLabel className="text-sm">Item name (if no SKU)</FormLabel>
              </div>
              <div className={SETTINGS_CONTROL_CLASS}>
                <FormControl>
                  <Input
                    variant="underline"
                    placeholder="e.g. Free soft drink"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : e.target.value,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      )}

      {rewardType === "PERCENTAGE_DISCOUNT" && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.percentageValue`}
            render={({ field }) => (
              <FormItem className={SETTINGS_ROW_CLASS}>
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">Discount %</FormLabel>
                </div>
                <div className={SETTINGS_CONTROL_CLASS}>
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
                            ? null
                            : Math.min(100, Math.max(0, Number(v))),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.appliesToEntirePurchase`}
            render={({ field }) => (
              <FormItem className={SETTINGS_ROW_CLASS}>
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">
                    Apply to entire purchase
                  </FormLabel>
                </div>
                <div className={SETTINGS_CONTROL_CLASS}>
                  <div className="flex items-center">
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <MinPurchaseToggleField<LoyaltyProgramFormValues>
            enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
            valueName={`${prefix}.minPurchaseForRedemption`}
            label="Min purchase for redemption"
            placeholder="0"
            layout="settings"
          />
          <MaxCapToggleField<LoyaltyProgramFormValues>
            enabledName={`${prefix}.maxDiscountCapEnabled`}
            valueName={`${prefix}.maxDiscountCap`}
            label="Max discount cap"
            placeholder="No limit"
            layout="settings"
          />
        </>
      )}

      {rewardType === "CASH_DISCOUNT" && (
        <>
          <FormField
            control={form.control}
            name={`${prefix}.cashAmount`}
            render={({ field }) => (
              <FormItem className={SETTINGS_ROW_CLASS}>
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">
                    Cash discount amount (₹)
                  </FormLabel>
                </div>
                <div className={SETTINGS_CONTROL_CLASS}>
                  <FormControl>
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="e.g. 1500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(
                          v === "" ? null : Math.max(0, Number(v)),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <MinPurchaseToggleField<LoyaltyProgramFormValues>
            enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
            valueName={`${prefix}.minPurchaseForRedemption`}
            label="Min purchase for redemption"
            placeholder="0"
            layout="settings"
          />
          <MaxCapToggleField<LoyaltyProgramFormValues>
            enabledName={`${prefix}.maxDiscountCapEnabled`}
            valueName={`${prefix}.maxDiscountCap`}
            label="Max discount cap"
            placeholder="No limit"
            layout="settings"
          />
        </>
      )}
    </div>
  );
}
