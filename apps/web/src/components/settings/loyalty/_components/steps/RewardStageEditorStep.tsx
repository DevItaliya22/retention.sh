"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import { Button, useFormContext } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { RewardStageCard } from "../shared";

const DEFAULT_STAGE = {
  pointsRequired: 0,
  rewardType: "PERCENTAGE_DISCOUNT" as const,
  rewardName: "",
  freeItemSkuId: null as string | null,
  freeItemName: null as string | null,
  percentageValue: null as number | null,
  appliesToEntirePurchase: true,
  specificProductIds: [] as string[],
  cashAmount: null as number | null,
  minPurchaseForRedemptionEnabled: false,
  minPurchaseForRedemption: null as number | null,
  maxDiscountCapEnabled: false,
  maxDiscountCap: null as number | null,
};

export function RewardStageEditorStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rewardStages",
  });

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Add reward stages. Customers redeem points for these rewards.
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <RewardStageCard
            key={field.id}
            index={index}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(DEFAULT_STAGE)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add reward stage
      </Button>
    </div>
  );
}
