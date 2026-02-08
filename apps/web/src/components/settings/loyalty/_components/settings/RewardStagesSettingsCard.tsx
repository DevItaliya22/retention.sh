"use client";

import type { LoyaltyRewardStage } from "@/hooks/loyalty/useLoyaltySettings";
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

function mapStageToForm(stage: LoyaltyRewardStage) {
  return {
    id: stage.id,
    pointsRequired: stage.pointsRequired,
    rewardType: stage.rewardType,
    rewardName: stage.rewardName,
    freeItemSkuId: stage.freeItemSkuId,
    freeItemName: stage.freeItemName,
    percentageValue: stage.percentageValue,
    appliesToEntirePurchase: stage.appliesToEntirePurchase,
    specificProductIds: stage.specificProductIds ?? [],
    cashAmount: stage.cashAmount,
    minPurchaseForRedemptionEnabled: stage.minPurchaseForRedemptionEnabled,
    minPurchaseForRedemption: stage.minPurchaseForRedemption,
    maxDiscountCapEnabled: stage.maxDiscountCapEnabled,
    maxDiscountCap: stage.maxDiscountCap,
  };
}

interface RewardStagesSettingsCardProps {
  stages: LoyaltyRewardStage[];
  onSave: (stages: Omit<LoyaltyRewardStage, "id">[]) => void;
  isSaving: boolean;
}

export function RewardStagesSettingsCard({
  stages,
  onSave,
  isSaving,
}: RewardStagesSettingsCardProps) {
  const form = useForm({
    defaultValues: {
      rewardStages:
        stages.length > 0 ? stages.map(mapStageToForm) : [DEFAULT_STAGE],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rewardStages",
  });

  const handleSave = form.handleSubmit((values) => {
    const payload = values.rewardStages.map((s) => ({
      pointsRequired: s.pointsRequired,
      rewardType: s.rewardType,
      rewardName: s.rewardName,
      freeItemSkuId: s.freeItemSkuId ?? null,
      freeItemName: s.freeItemName ?? null,
      percentageValue: s.percentageValue ?? null,
      appliesToEntirePurchase: s.appliesToEntirePurchase ?? true,
      specificProductIds: s.specificProductIds ?? [],
      cashAmount: s.cashAmount ?? null,
      minPurchaseForRedemptionEnabled: s.minPurchaseForRedemptionEnabled,
      minPurchaseForRedemption: s.minPurchaseForRedemption,
      maxDiscountCapEnabled: s.maxDiscountCapEnabled,
      maxDiscountCap: s.maxDiscountCap,
    }));
    onSave(payload);
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Reward stages</CardTitle>
        <CardDescription className="text-xs">
          Configure redeemable rewards at different point thresholds
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-4 px-6 py-4">
              <p className="text-muted-foreground text-sm">
                Customers redeem points for these rewards.
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
