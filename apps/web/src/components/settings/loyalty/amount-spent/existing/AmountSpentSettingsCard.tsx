"use client";

import {
  RewardStagesTabbedSection,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type {
  LoyaltyResponse,
  LoyaltyRewardStage,
} from "@/hooks/loyalty/useLoyaltySettings";
import {
  createDefaultRewardStage,
  normalizeRewardStageForForm,
} from "@/lib/loyalty/form-defaults";
import type { LoyaltyRewardType } from "@/lib/schemas/loyalty";
import {
  rewardStagesStepSchema,
  type LoyaltyProgramFormValues,
} from "@/lib/schemas/loyalty-form";
import {
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
  Switch,
  useForm,
} from "@reelo/ui/components";
import { toast } from "sonner";

const DEFAULT_STAGE = createDefaultRewardStage();

function mapStageToForm(stage: LoyaltyRewardStage, index: number) {
  return normalizeRewardStageForForm(
    {
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
    },
    index,
  );
}

type AmountSpentConfig = NonNullable<LoyaltyResponse["amountSpentConfig"]>;

interface AmountSpentSettingsCardProps {
  config: AmountSpentConfig;
  onSave: (
    data: {
      amountSpentConfig: Partial<Omit<AmountSpentConfig, "rewardStages">>;
      rewardStages: Omit<LoyaltyRewardStage, "id">[];
    },
    options?: { onSuccess?: () => void; onError?: (e: unknown) => void },
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

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    form.clearErrors("rewardStages");
    const rewardStagesValidation = rewardStagesStepSchema.safeParse({
      rewardStages: values.rewardStages,
    });
    if (!rewardStagesValidation.success) {
      const firstIssue = rewardStagesValidation.error.issues[0];
      for (const issue of rewardStagesValidation.error.issues) {
        const [root, index, field] = issue.path;
        if (
          root === "rewardStages" &&
          typeof index === "number" &&
          typeof field === "string"
        ) {
          form.setError(`rewardStages.${index}.${field}` as never, {
            type: "manual",
            message: issue.message,
          });
        }
      }
      const message =
        typeof firstIssue?.path?.[1] === "number" && firstIssue.path[2]
          ? `Reward stage ${Number(firstIssue.path[1]) + 1}: ${String(firstIssue.path[2])} is required.`
          : "Please complete all reward stages before saving.";
      toast.error(message);
      throw new Error(message);
    }
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
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Points & reward stages
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          How customers earn points per bill and redeem for rewards. Reward
          stages — customers redeem points for these rewards.
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-3">
              <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
                <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-4 pt-4 pb-0">
                  <CardTitle className="text-foreground text-base leading-none font-semibold">
                    Common settings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-0.5 text-sm">
                    Points conversion and redemption rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4 pt-4">
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
                              onFocus={(e) => e.currentTarget.select()}
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
                            Earn on final amount
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Apply points on final amount (after store discounts
                            and tax).
                          </p>
                        </div>
                        <div className={SETTINGS_CONTROL_CLASS}>
                          <div className="flex items-center">
                            <FormControl>
                              <Switch
                                id="amountSpent-onFinalAmount"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
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
                            Max points per purchase
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Leave empty for no cap.
                          </p>
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
                              onFocus={(e) => e.currentTarget.select()}
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
                      <FormItem className={SETTINGS_ROW_CLASS}>
                        <div className={SETTINGS_LABEL_CLASS}>
                          <FormLabel
                            htmlFor="amountSpent-allowSameBillRedemption"
                            className="cursor-pointer text-sm"
                          >
                            Same-bill redemption
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Allow customers to use points earned on this bill on
                            the same bill. If off, points are available from the
                            next bill only.
                          </p>
                        </div>
                        <div className={SETTINGS_CONTROL_CLASS}>
                          <div className="flex items-center">
                            <FormControl>
                              <Switch
                                id="amountSpent-allowSameBillRedemption"
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
                </CardContent>
              </Card>
              <RewardStagesTabbedSection
                title="Reward stages"
                description="Customers redeem points for these rewards."
                addButtonLabel="New stage"
                gooeyId="loyalty-amount-spent-existing-gooey"
                defaultStage={DEFAULT_STAGE}
              />
            </div>
            <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!form.formState.isDirty || isSaving}
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
