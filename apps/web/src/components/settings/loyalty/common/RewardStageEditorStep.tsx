"use client";

import {
  createDefaultRewardStage,
  getNextRewardStage,
} from "@/lib/loyalty/form-defaults";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import { Button, Separator, useFormContext } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { RewardStageCard } from "./RewardStageCard";

export function RewardStageEditorStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rewardStages",
  });

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground max-w-md text-sm">
        Add reward stages. Customers redeem points for these rewards.
      </p>
      <div className="space-y-0">
        {fields.map((field, index) => (
          <div key={field.id}>
            <RewardStageCard
              index={index}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
            />
            {index < fields.length - 1 && (
              <Separator className="bg-border my-6" />
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const previousStage =
            form.getValues("rewardStages")?.[fields.length - 1];
          append(
            previousStage
              ? getNextRewardStage(previousStage, fields.length)
              : createDefaultRewardStage({}, fields.length),
          );
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add reward stage
      </Button>
    </div>
  );
}
