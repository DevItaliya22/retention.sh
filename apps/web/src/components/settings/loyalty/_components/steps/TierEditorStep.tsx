"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import { Button, useFormContext } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { TierCard } from "../shared";

const DEFAULT_TIER = {
  name: "",
  rank: 1,
  minLifetimeSpend: 0,
  maxLifetimeSpend: null as number | null,
  cashbackPercentage: 0,
  minPurchaseForRedemptionEnabled: false,
  minPurchaseForRedemption: null as number | null,
  maxCashbackCapEnabled: false,
  maxCashbackCap: null as number | null,
};

export function TierEditorStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });
  const watchedTiers = form.watch("tiers") ?? [];
  const maxRank =
    watchedTiers.length > 0
      ? Math.max(...watchedTiers.map((t) => Number(t?.rank ?? 0)))
      : 0;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Add tiers based on customer lifetime spending. Higher rank = better
        tier.
      </p>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <TierCard
            key={field.id}
            index={index}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
            isTopTier={
              Number(watchedTiers?.[index]?.rank ?? 0) === maxRank &&
              maxRank > 0
            }
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            ...DEFAULT_TIER,
            rank: fields.length + 1,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add tier
      </Button>
    </div>
  );
}
