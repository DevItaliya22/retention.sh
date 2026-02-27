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
import type {
  LoyaltyRewardType,
  VisitIntervalUnit,
} from "@/lib/schemas/loyalty";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  useForm,
} from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";

const VISIT_INTERVAL_UNITS = [
  { value: "MINUTE", label: "Minute(s)", max: 60 },
  { value: "HOUR", label: "Hour(s)", max: 23 },
  { value: "DAY", label: "Day(s)", max: 31 },
  { value: "WEEK", label: "Week(s)", max: 4 },
  { value: "MONTH", label: "Month(s)", max: 12 },
] as const;

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

type VisitMadeConfig = NonNullable<LoyaltyResponse["visitMadeConfig"]>;

interface VisitMadeSettingsCardProps {
  config: VisitMadeConfig;
  onSave: (
    data: {
      visitMadeConfig: Partial<Omit<VisitMadeConfig, "rewardStages">>;
      rewardStages: Omit<LoyaltyRewardStage, "id">[];
    },
    options?: { onSuccess?: () => void },
  ) => void;
  isSaving: boolean;
}

export function VisitMadeSettingsCard({
  config,
  onSave,
  isSaving,
}: VisitMadeSettingsCardProps) {
  const form = useForm<LoyaltyProgramFormValues>({
    defaultValues: {
      pointsPerVisit: config.pointsPerVisit ?? 1,
      visitIntervalEnabled: config.visitIntervalEnabled ?? false,
      visitIntervalValue: config.visitIntervalValue ?? null,
      visitIntervalUnit: config.visitIntervalUnit ?? null,
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
      visitMadeConfig: {
        pointsPerVisit: values.pointsPerVisit ?? 1,
        visitIntervalEnabled: values.visitIntervalEnabled ?? false,
        visitIntervalValue: values.visitIntervalValue ?? null,
        visitIntervalUnit: (values.visitIntervalUnit ??
          null) as VisitIntervalUnit | null,
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
    <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Visit & reward stages
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          How customers earn points per visit and redeem for rewards
        </CardDescription>
      </CardHeader>
      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
                <FormField
                  control={form.control}
                  name="pointsPerVisit"
                  render={({ field }) => (
                    <FormItem className={SETTINGS_ROW_CLASS}>
                      <div className={SETTINGS_LABEL_CLASS}>
                        <FormLabel className="text-sm">
                          Points per visit
                        </FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
                        <FormControl>
                          <Input
                            variant="underline"
                            type="number"
                            min={0}
                            step="1"
                            placeholder="1"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(
                                v === ""
                                  ? undefined
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
                  name="visitIntervalEnabled"
                  render={({ field }) => (
                    <FormItem className={SETTINGS_ROW_CLASS}>
                      <div className={SETTINGS_LABEL_CLASS}>
                        <FormLabel
                          htmlFor="visit-visitIntervalEnabled"
                          className="cursor-pointer text-sm"
                        >
                          Require minimum time between visits to count as
                          separate
                        </FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
                        <FormControl>
                          <Switch
                            id="visit-visitIntervalEnabled"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                {form.watch("visitIntervalEnabled") && (
                  <div className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Interval value & unit
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="visitIntervalValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Interval value
                              </FormLabel>
                              <FormControl>
                                <Input
                                  variant="underline"
                                  type="number"
                                  min={1}
                                  placeholder="e.g. 24"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    const unit =
                                      form.watch("visitIntervalUnit");
                                    const unitConfig =
                                      VISIT_INTERVAL_UNITS.find(
                                        (u) => u.value === unit,
                                      );
                                    const maxVal = unitConfig?.max ?? 60;
                                    field.onChange(
                                      v === ""
                                        ? null
                                        : Math.min(
                                            maxVal,
                                            Math.max(1, parseInt(v, 10) || 1),
                                          ),
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
                          name="visitIntervalUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Interval unit
                              </FormLabel>
                              <Select
                                value={field.value ?? ""}
                                onValueChange={(v) => field.onChange(v || null)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {VISIT_INTERVAL_UNITS.map((u) => (
                                    <SelectItem key={u.value} value={u.value}>
                                      {u.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                    {index < fields.length - 1 && (
                      <Separator className="my-4" />
                    )}
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
              <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
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
    </Card>
  );
}
