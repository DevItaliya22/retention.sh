"use client";

import type { LoyaltyRewardType } from "@/lib/schemas/loyalty";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  Switch,
  useFormContext,
} from "@reelo/ui/components";
import { Trash2 } from "lucide-react";
import { MaxCapToggleField } from "./MaxCapToggleField";
import { MinPurchaseToggleField } from "./MinPurchaseToggleField";

const REWARD_TYPES: { value: LoyaltyRewardType; label: string }[] = [
  { value: "FREE_ITEM", label: "Free item" },
  { value: "PERCENTAGE_DISCOUNT", label: "% discount" },
  { value: "CASH_DISCOUNT", label: "Cash discount" },
];

interface RewardStageCardProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function RewardStageCard({
  index,
  onRemove,
  canRemove,
}: RewardStageCardProps) {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const prefix = `rewardStages.${index}` as const;
  const rewardType = form.watch(`${prefix}.rewardType`) as LoyaltyRewardType;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium">Reward stage {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`${prefix}.pointsRequired`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm">Points required</Label>
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
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.rewardName`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm">Reward name (display)</Label>
              <FormControl>
                <Input
                  variant="underline"
                  placeholder="e.g. 10% off on entire purchase"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.rewardType`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm">Reward type</Label>
              <div className="flex flex-wrap gap-4 pt-2">
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
            </FormItem>
          )}
        />

        {rewardType === "FREE_ITEM" && (
          <>
            <FormField
              control={form.control}
              name={`${prefix}.freeItemName`}
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm">Item name (if no SKU)</Label>
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
                </FormItem>
              )}
            />
          </>
        )}

        {rewardType === "PERCENTAGE_DISCOUNT" && (
          <>
            <FormField
              control={form.control}
              name={`${prefix}.percentageValue`}
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm">Discount %</Label>
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
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${prefix}.appliesToEntirePurchase`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm font-normal">
                        Apply to entire purchase
                      </span>
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <MinPurchaseToggleField<LoyaltyProgramFormValues>
              enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
              valueName={`${prefix}.minPurchaseForRedemption`}
              label="Min purchase for redemption"
              placeholder="0"
            />
            <MaxCapToggleField<LoyaltyProgramFormValues>
              enabledName={`${prefix}.maxDiscountCapEnabled`}
              valueName={`${prefix}.maxDiscountCap`}
              label="Max discount cap"
              placeholder="No limit"
            />
          </>
        )}

        {rewardType === "CASH_DISCOUNT" && (
          <>
            <FormField
              control={form.control}
              name={`${prefix}.cashAmount`}
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm">Cash discount amount (₹)</Label>
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
                </FormItem>
              )}
            />
            <MinPurchaseToggleField<LoyaltyProgramFormValues>
              enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
              valueName={`${prefix}.minPurchaseForRedemption`}
              label="Min purchase for redemption"
              placeholder="0"
            />
            <MaxCapToggleField<LoyaltyProgramFormValues>
              enabledName={`${prefix}.maxDiscountCapEnabled`}
              valueName={`${prefix}.maxDiscountCap`}
              label="Max discount cap"
              placeholder="No limit"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
