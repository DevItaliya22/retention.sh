"use client";

import {
  RewardStageCard,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type {
  LoyaltyResponse,
  LoyaltyRewardStage,
} from "@/hooks/loyalty/useLoyaltySettings";
import type { LoyaltyRewardType } from "@/lib/schemas/loyalty";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
  Input,
  SaveButton,
  Separator,
  Switch,
  useForm,
} from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";

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

type AmountSpentConfig = NonNullable<LoyaltyResponse["amountSpentConfig"]>;

interface AmountSpentSettingsCardProps {
  config: AmountSpentConfig;
  onSave: (
    data: {
      amountSpentConfig: Partial<Omit<AmountSpentConfig, "rewardStages">>;
      rewardStages: Omit<LoyaltyRewardStage, "id">[];
    },
    options?: { onSuccess?: () => void },
  ) => void;
  isSaving: boolean;
}

export function AmountSpentSettingsCard({
  config,
  onSave,
  isSaving,
}: AmountSpentSettingsCardProps) {
  const form = useForm<LoyaltyProgramFormValues>({
    defaultValues: {
      pointsPerRupee: config.pointsPerRupee ?? 1,
      onFinalAmount: config.onFinalAmount ?? false,
      maxPointsPerPurchase: config.maxPointsPerPurchase ?? null,
      allowSameBillRedemption: config.allowSameBillRedemption ?? true,
      rewardStages:
        config.rewardStages?.length > 0
          ? config.rewardStages.map(mapStageToForm)
          : [DEFAULT_STAGE],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rewardStages",
  });

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const payload = {
      amountSpentConfig: {
        pointsPerRupee: values.pointsPerRupee ?? 1,
        onFinalAmount: values.onFinalAmount ?? false,
        maxPointsPerPurchase: values.maxPointsPerPurchase ?? null,
        allowSameBillRedemption: values.allowSameBillRedemption ?? true,
      },
      rewardStages: (values.rewardStages ?? []).map((s) => ({
        pointsRequired: s.pointsRequired,
        rewardType: s.rewardType as LoyaltyRewardType,
        rewardName: s.rewardName,
        freeItemSkuId: s.freeItemSkuId ?? null,
        freeItemName: s.freeItemName ?? null,
        percentageValue: s.percentageValue ?? null,
        appliesToEntirePurchase: s.appliesToEntirePurchase ?? true,
        specificProductIds: s.specificProductIds ?? [],
        cashAmount: s.cashAmount ?? null,
        minPurchaseForRedemptionEnabled:
          s.minPurchaseForRedemptionEnabled ?? false,
        minPurchaseForRedemption: s.minPurchaseForRedemption ?? null,
        maxDiscountCapEnabled: s.maxDiscountCapEnabled ?? false,
        maxDiscountCap: s.maxDiscountCap ?? null,
      })),
    };
    return new Promise<void>((resolve, reject) => {
      onSave(payload, {
        onSuccess: () => {
          form.reset(values, { keepDefaultValues: false });
          resolve();
        },
        onError: (e) => reject(e),
      } as { onSuccess?: () => void; onError?: (e: unknown) => void });
    });
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Points & reward stages
        </CardTitle>
        <CardDescription className="text-xs">
          How customers earn points per bill and redeem for rewards
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4 last:border-none">
              <FormField
                control={form.control}
                name="pointsPerRupee"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Points per rupee spent
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="1"
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
                name="onFinalAmount"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel
                        htmlFor="amountSpent-onFinalAmount"
                        className="cursor-pointer text-sm"
                      >
                        Earn points on final amount (after store discounts and
                        tax)
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Switch
                          id="amountSpent-onFinalAmount"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPointsPerPurchase"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Max points per purchase — leave empty for no cap
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          step="1"
                          placeholder="No limit"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(
                              v === ""
                                ? null
                                : Math.max(0, parseInt(v, 10) || 0),
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
                name="allowSameBillRedemption"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <label className="flex cursor-pointer items-center gap-2">
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm font-normal">
                          Allow customers to use points earned on this bill on
                          the same bill (if off, points are available from the
                          next bill only)
                        </span>
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <p className="text-muted-foreground text-sm">
                Reward stages — customers redeem points for these rewards.
              </p>
              {fields.map((field, index) => (
                <div key={field.id}>
                  <RewardStageCard
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                  {index < fields.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
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
            <CardFooter className="flex justify-end px-6 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!form.formState.isDirty}
                labels={{
                  idle: "Save changes",
                  loading: "Saving",
                  success: "Saved",
                }}
              />
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
    </Card>
  );
}
