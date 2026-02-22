"use client";

import type { LoyaltyRewardType } from "@/lib/schemas/loyalty";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
  useFormContext,
} from "@reelo/ui/components";
import { Trash2 } from "lucide-react";
import { useState } from "react";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const form = useFormContext<LoyaltyProgramFormValues>();
  const prefix = `rewardStages.${index}` as const;
  const rewardType = form.watch(`${prefix}.rewardType`) as LoyaltyRewardType;

  const handleConfirmRemove = () => {
    onRemove();
    setDeleteOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <h3 className="text-base font-medium">Reward stage {index + 1}</h3>
        {canRemove && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Delete reward stage ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete reward stage {index + 1}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This reward stage will be removed. You can add it back later
                    if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmRemove}
                    className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <div className="grid gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.pointsRequired`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points required</FormLabel>
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
              <FormLabel>Reward name (display)</FormLabel>
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
              <FormLabel>Reward type</FormLabel>
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
                  <FormLabel>Item name (if no SKU)</FormLabel>
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
                  <FormLabel>Discount %</FormLabel>
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
                <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
                  <div className="min-w-0 space-y-0.5">
                    <FormLabel>Apply to entire purchase</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
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

        {rewardType === "CASH_DISCOUNT" && (
          <>
            <FormField
              control={form.control}
              name={`${prefix}.cashAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cash discount amount (₹)</FormLabel>
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
      </div>
    </section>
  );
}
