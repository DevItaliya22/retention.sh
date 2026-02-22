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

  const handleSave = form.handleSubmit((values) => {
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
    onSave(payload, {
      onSuccess: () => form.reset(values, { keepDefaultValues: false }),
    });
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Cashback configuration
        </CardTitle>
        <CardDescription className="text-xs">
          Cashback percentage, earning/redemption rules, and limits
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-6 px-6 py-4">
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

              <FormField
                control={form.control}
                name="allowSameBillRedemption"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-2">
                    <FormControl>
                      <label className="flex cursor-pointer items-center gap-2">
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm font-normal">
                          Allow customers to use cashback earned on this bill on
                          the same bill (if off, cashback is available from the
                          next bill only)
                        </span>
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-6">
                {/* Redemption limits on wallet: label, then spacing, then switch + (when on) kind selector + one input */}
                <div className={SETTINGS_ROW_CLASS}>
                  <div className={SETTINGS_LABEL_CLASS}>
                    <FormLabel className="text-sm">
                      Redemption limits on wallet balance
                    </FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Cap how much of their cashback balance a customer can use
                      at once.
                    </p>
                  </div>
                  <div className={SETTINGS_CONTROL_CLASS}>
                    <div className="pt-2">
                      <FormField
                        control={form.control}
                        name="redemptionBalanceLimitEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <label className="flex cursor-pointer items-center gap-2">
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="text-sm font-normal">
                                  Limit redemption on wallet balance
                                </span>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("redemptionBalanceLimitEnabled") && (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <Select
                          value={
                            form.watch("redemptionBalanceLimitAmount") != null
                              ? "AMOUNT"
                              : "PERCENTAGE"
                          }
                          onValueChange={(v) => {
                            if (v === "AMOUNT") {
                              form.setValue(
                                "redemptionBalanceLimitPercentage",
                                null,
                              );
                              form.setValue("redemptionBalanceLimitAmount", 0);
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
                            <SelectItem value="AMOUNT">Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.watch("redemptionBalanceLimitAmount") != null ? (
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
                    )}
                  </div>
                </div>

                {/* Redemption limits on bill: same pattern */}
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
                    <div className="pt-2">
                      <FormField
                        control={form.control}
                        name="redemptionBillLimitEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <label className="flex cursor-pointer items-center gap-2">
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="text-sm font-normal">
                                  Limit redemption on bill amount
                                </span>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("redemptionBillLimitEnabled") && (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <Select
                          value={
                            form.watch("redemptionBillLimitAmount") != null
                              ? "AMOUNT"
                              : "PERCENTAGE"
                          }
                          onValueChange={(v) => {
                            if (v === "AMOUNT") {
                              form.setValue(
                                "redemptionBillLimitPercentage",
                                null,
                              );
                              form.setValue("redemptionBillLimitAmount", 0);
                            } else {
                              form.setValue("redemptionBillLimitAmount", null);
                              form.setValue("redemptionBillLimitPercentage", 0);
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
                            <SelectItem value="AMOUNT">Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.watch("redemptionBillLimitAmount") != null ? (
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
                    )}
                  </div>
                </div>
              </div>
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
