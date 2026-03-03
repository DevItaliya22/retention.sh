"use client";

import {
  MinPurchaseToggleField,
  numericInputHandlers,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type { LoyaltyResponse } from "@/hooks/loyalty/useLoyaltySettings";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useForm,
} from "@reelo/ui/components";

type CashbackConfig = NonNullable<LoyaltyResponse["cashbackConfig"]>;

interface CashbackSettingsCardProps {
  config: CashbackConfig;
  onSave: (
    payload: Partial<CashbackConfig>,
    options?: { onSuccess?: () => void },
  ) => void;
  isSaving: boolean;
}

export function CashbackSettingsCard({
  config,
  onSave,
  isSaving,
}: CashbackSettingsCardProps) {
  const form = useForm({
    defaultValues: {
      cashbackPercentage: config.cashbackPercentage ?? 0,
      onFinalAmount: config.onFinalAmount ?? false,
      maxCashbackCap: config.maxCashbackCap ?? null,
      minPurchaseForEarningEnabled:
        config.minPurchaseForEarningEnabled ?? false,
      minPurchaseForEarning: config.minPurchaseForEarning ?? null,
      minPurchaseForRedemptionEnabled:
        config.minPurchaseForRedemptionEnabled ?? false,
      minPurchaseForRedemption: config.minPurchaseForRedemption ?? null,
      redemptionBalanceLimitEnabled:
        config.redemptionBalanceLimitEnabled ?? false,
      redemptionBalanceLimitAmount: config.redemptionBalanceLimitAmount ?? null,
      redemptionBalanceLimitPercentage:
        config.redemptionBalanceLimitPercentage ?? null,
      redemptionBillLimitEnabled: config.redemptionBillLimitEnabled ?? false,
      redemptionBillLimitAmount: config.redemptionBillLimitAmount ?? null,
      redemptionBillLimitPercentage:
        config.redemptionBillLimitPercentage ?? null,
      allowSameBillRedemption: config.allowSameBillRedemption ?? false,
    },
  });

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const payload: Partial<CashbackConfig> = {
      cashbackPercentage: values.cashbackPercentage,
      onFinalAmount: values.onFinalAmount,
      maxCashbackCap: values.maxCashbackCap,
      minPurchaseForEarningEnabled: values.minPurchaseForEarningEnabled,
      minPurchaseForEarning: values.minPurchaseForEarning,
      minPurchaseForRedemptionEnabled: values.minPurchaseForRedemptionEnabled,
      minPurchaseForRedemption: values.minPurchaseForRedemption,
      redemptionBalanceLimitEnabled: values.redemptionBalanceLimitEnabled,
      redemptionBalanceLimitAmount: values.redemptionBalanceLimitAmount,
      redemptionBalanceLimitPercentage: values.redemptionBalanceLimitPercentage,
      redemptionBillLimitEnabled: values.redemptionBillLimitEnabled,
      redemptionBillLimitAmount: values.redemptionBillLimitAmount,
      redemptionBillLimitPercentage: values.redemptionBillLimitPercentage,
      allowSameBillRedemption: values.allowSameBillRedemption,
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
          Cashback configuration
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Cashback percentage, earning/redemption rules, and limits
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-6 overflow-auto px-4 py-4">
                <FormField
                  control={form.control}
                  name="cashbackPercentage"
                  render={({ field }) => (
                    <FormItem className={SETTINGS_ROW_CLASS}>
                      <div className={SETTINGS_LABEL_CLASS}>
                        <FormLabel className="text-sm">
                          Cashback percentage
                        </FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
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
                                  ? undefined
                                  : Math.min(100, Math.max(0, Number(v))),
                              );
                            }}
                            {...numericInputHandlers}
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
                          htmlFor="cashback-onFinalAmount"
                          className="cursor-pointer text-sm"
                        >
                          Calculate cashback on final amount (after store
                          discounts and tax)
                        </FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
                        <FormControl>
                          <Switch
                            id="cashback-onFinalAmount"
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
                  name="maxCashbackCap"
                  render={({ field }) => (
                    <FormItem className={SETTINGS_ROW_CLASS}>
                      <div className={SETTINGS_LABEL_CLASS}>
                        <FormLabel className="text-sm">
                          Max cashback per bill (₹) — leave empty for no cap
                        </FormLabel>
                      </div>
                      <div className={SETTINGS_CONTROL_CLASS}>
                        <FormControl>
                          <Input
                            variant="underline"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="No limit"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(
                                v === "" ? null : Math.max(0, Number(v)),
                              );
                            }}
                            {...numericInputHandlers}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <MinPurchaseToggleField
                  enabledName="minPurchaseForEarningEnabled"
                  valueName="minPurchaseForEarning"
                  label="Min purchase for earning"
                  placeholder="0"
                  layout="settings"
                />
                <MinPurchaseToggleField
                  enabledName="minPurchaseForRedemptionEnabled"
                  valueName="minPurchaseForRedemption"
                  label="Min purchase for redemption"
                  placeholder="0"
                  layout="settings"
                />

                <div className={SETTINGS_ROW_CLASS}>
                  <div className={SETTINGS_LABEL_CLASS}>
                    <FormLabel className="text-sm">
                      Allow customers to use cashback earned on this bill on the
                      same bill
                    </FormLabel>
                    <p className="text-muted-foreground text-xs">
                      If off, cashback is available from the next bill only.
                    </p>
                  </div>
                  <div className={SETTINGS_CONTROL_CLASS}>
                    <FormField
                      control={form.control}
                      name="allowSameBillRedemption"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  {/* Redemption limits on wallet: same UI as min purchase — sub-header row + switch, then label + type + input */}
                  <div className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Redemption limits on wallet balance
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Cap how much of their cashback balance a customer can
                        use at once.
                      </p>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="redemptionBalanceLimitEnabled"
                          render={({ field }) => (
                            <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
                              <FormLabel className="text-sm font-medium">
                                Redemption limits on wallet balance
                              </FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch("redemptionBalanceLimitEnabled") && (
                          <>
                            <FormItem>
                              <FormLabel className="text-sm">
                                {form.watch("redemptionBalanceLimitAmount") !=
                                null
                                  ? "Amount (₹)"
                                  : "% of balance"}
                              </FormLabel>
                              <div className="mt-1 flex flex-wrap items-end gap-2">
                                <Select
                                  value={
                                    form.watch(
                                      "redemptionBalanceLimitAmount",
                                    ) != null
                                      ? "AMOUNT"
                                      : "PERCENTAGE"
                                  }
                                  onValueChange={(v) => {
                                    if (v === "AMOUNT") {
                                      form.setValue(
                                        "redemptionBalanceLimitPercentage",
                                        null,
                                      );
                                      form.setValue(
                                        "redemptionBalanceLimitAmount",
                                        0,
                                      );
                                    } else {
                                      form.setValue(
                                        "redemptionBalanceLimitAmount",
                                        null,
                                      );
                                      form.setValue(
                                        "redemptionBalanceLimitPercentage",
                                        0,
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PERCENTAGE">
                                      % of balance
                                    </SelectItem>
                                    <SelectItem value="AMOUNT">
                                      Amount (₹)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {form.watch("redemptionBalanceLimitAmount") !=
                                null ? (
                                  <FormField
                                    control={form.control}
                                    name="redemptionBalanceLimitAmount"
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input
                                            variant="underline"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            placeholder="e.g. 500"
                                            className="w-[120px]"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              field.onChange(
                                                v === ""
                                                  ? null
                                                  : Math.max(0, Number(v)),
                                              );
                                            }}
                                            {...numericInputHandlers}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ) : (
                                  <FormField
                                    control={form.control}
                                    name="redemptionBalanceLimitPercentage"
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input
                                            variant="underline"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step="0.01"
                                            placeholder="e.g. 50"
                                            className="w-[120px]"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              field.onChange(
                                                v === ""
                                                  ? null
                                                  : Math.min(
                                                      100,
                                                      Math.max(0, Number(v)),
                                                    ),
                                              );
                                            }}
                                            {...numericInputHandlers}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </FormItem>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Redemption limits on bill: same UI as min purchase */}
                  <div className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Redemption limits on bill amount
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        Cap redemption relative to the current bill total.
                      </p>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="redemptionBillLimitEnabled"
                          render={({ field }) => (
                            <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
                              <FormLabel className="text-sm font-medium">
                                Redemption limits on bill amount
                              </FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch("redemptionBillLimitEnabled") && (
                          <>
                            <FormItem>
                              <FormLabel className="text-sm">
                                {form.watch("redemptionBillLimitAmount") != null
                                  ? "Amount (₹)"
                                  : "% of bill"}
                              </FormLabel>
                              <div className="mt-1 flex flex-wrap items-end gap-2">
                                <Select
                                  value={
                                    form.watch("redemptionBillLimitAmount") !=
                                    null
                                      ? "AMOUNT"
                                      : "PERCENTAGE"
                                  }
                                  onValueChange={(v) => {
                                    if (v === "AMOUNT") {
                                      form.setValue(
                                        "redemptionBillLimitPercentage",
                                        null,
                                      );
                                      form.setValue(
                                        "redemptionBillLimitAmount",
                                        0,
                                      );
                                    } else {
                                      form.setValue(
                                        "redemptionBillLimitAmount",
                                        null,
                                      );
                                      form.setValue(
                                        "redemptionBillLimitPercentage",
                                        0,
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PERCENTAGE">
                                      % of bill
                                    </SelectItem>
                                    <SelectItem value="AMOUNT">
                                      Amount (₹)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {form.watch("redemptionBillLimitAmount") !=
                                null ? (
                                  <FormField
                                    control={form.control}
                                    name="redemptionBillLimitAmount"
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input
                                            variant="underline"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            placeholder="e.g. 200"
                                            className="w-[120px]"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              field.onChange(
                                                v === ""
                                                  ? null
                                                  : Math.max(0, Number(v)),
                                              );
                                            }}
                                            {...numericInputHandlers}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ) : (
                                  <FormField
                                    control={form.control}
                                    name="redemptionBillLimitPercentage"
                                    render={({ field }) => (
                                      <FormItem className="mb-0">
                                        <FormControl>
                                          <Input
                                            variant="underline"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step="0.01"
                                            placeholder="e.g. 20"
                                            className="w-[120px]"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              field.onChange(
                                                v === ""
                                                  ? null
                                                  : Math.min(
                                                      100,
                                                      Math.max(0, Number(v)),
                                                    ),
                                              );
                                            }}
                                            {...numericInputHandlers}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </FormItem>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
