"use client";

import type { LoyaltyTier } from "@/hooks/loyalty/useLoyaltySettings";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormProvider,
  useForm,
} from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { TierCard } from "../shared";

const DEFAULT_TIER = {
  name: "",
  rank: 1,
  minLifetimeSpend: 0,
  maxLifetimeSpend: null as number | null,
  cashbackPercentage: 0,
  minPurchaseForEarningEnabled: false,
  minPurchaseForEarning: null as number | null,
  minPurchaseForRedemptionEnabled: false,
  minPurchaseForRedemption: null as number | null,
  maxCashbackCapEnabled: false,
  maxCashbackCap: null as number | null,
};

function mapTierToForm(tier: LoyaltyTier) {
  return {
    id: tier.id,
    name: tier.name,
    rank: tier.rank,
    minLifetimeSpend: tier.minLifetimeSpend,
    maxLifetimeSpend: tier.maxLifetimeSpend,
    cashbackPercentage: tier.cashbackPercentage,
    minPurchaseForEarningEnabled: tier.minPurchaseForEarningEnabled,
    minPurchaseForEarning: tier.minPurchaseForEarning,
    minPurchaseForRedemptionEnabled: tier.minPurchaseForRedemptionEnabled,
    minPurchaseForRedemption: tier.minPurchaseForRedemption,
    maxCashbackCapEnabled: tier.maxCashbackCapEnabled,
    maxCashbackCap: tier.maxCashbackCap,
  };
}

interface TiersSettingsCardProps {
  tiers: LoyaltyTier[];
  onSave: (tiers: Omit<LoyaltyTier, "id">[]) => void;
  isSaving: boolean;
}

export function TiersSettingsCard({
  tiers,
  onSave,
  isSaving,
}: TiersSettingsCardProps) {
  const form = useForm({
    defaultValues: {
      tiers: tiers.map(mapTierToForm),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  const handleSave = form.handleSubmit((values) => {
    const payload = values.tiers.map((t) => ({
      name: t.name,
      rank: t.rank,
      minLifetimeSpend: t.minLifetimeSpend,
      maxLifetimeSpend: t.maxLifetimeSpend,
      cashbackPercentage: t.cashbackPercentage,
      minPurchaseForEarningEnabled: t.minPurchaseForEarningEnabled,
      minPurchaseForEarning: t.minPurchaseForEarning,
      minPurchaseForRedemptionEnabled: t.minPurchaseForRedemptionEnabled,
      minPurchaseForRedemption: t.minPurchaseForRedemption,
      maxCashbackCapEnabled: t.maxCashbackCapEnabled,
      maxCashbackCap: t.maxCashbackCap,
    }));
    onSave(payload);
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Manage tiers</CardTitle>
        <CardDescription className="text-xs">
          Add, edit, or remove tiers based on lifetime spending
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-4 px-6 py-4">
              <p className="text-muted-foreground text-sm">
                Higher rank = better tier. Customers progress based on lifetime
                spend.
              </p>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <TierCard
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
                onClick={() =>
                  append({
                    id: crypto.randomUUID(),
                    ...DEFAULT_TIER,
                    rank: fields.length + 1,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add tier
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button
                type="button"
                onClick={handleSave}
                loading={isSaving}
                disabled={!form.formState.isDirty}
              >
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
    </Card>
  );
}
