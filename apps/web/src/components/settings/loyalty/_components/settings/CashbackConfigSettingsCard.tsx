"use client";

import type { LoyaltyResponse } from "@/hooks/loyalty/useLoyaltySettings";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
  Input,
  useForm,
} from "@reelo/ui/components";
import { MinPurchaseToggleField } from "../shared";
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

type CashbackConfig = NonNullable<LoyaltyResponse["cashbackConfig"]>;

interface CashbackConfigSettingsCardProps {
  config: CashbackConfig;
  onSave: (payload: Partial<CashbackConfig>) => void;
  isSaving: boolean;
}

export function CashbackConfigSettingsCard({
  config,
  onSave,
  isSaving,
}: CashbackConfigSettingsCardProps) {
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
    },
  });

  const handleSave = form.handleSubmit((values) => {
    onSave({
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
                      <FormLabel className="text-sm">
                        Calculate cashback on final amount (after store
                        discounts and tax)
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Checkbox
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

              <div className="space-y-4 border-t pt-6">
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
                    <FormField
                      control={form.control}
                      name="redemptionBalanceLimitEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            Limit redemption on wallet balance
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    {form.watch("redemptionBalanceLimitEnabled") && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="redemptionBalanceLimitAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Max redeemable (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  variant="underline"
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="e.g. 500"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(
                                      v === "" ? null : Math.max(0, Number(v)),
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
                          name="redemptionBalanceLimitPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Max redeemable (% of balance)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  variant="underline"
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  placeholder="e.g. 50"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(
                                      v === ""
                                        ? null
                                        : Math.min(100, Math.max(0, Number(v))),
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

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
                    <FormField
                      control={form.control}
                      name="redemptionBillLimitEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            Limit redemption on bill amount
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    {form.watch("redemptionBillLimitEnabled") && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="redemptionBillLimitAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Max redeemable (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  variant="underline"
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  placeholder="e.g. 200"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(
                                      v === "" ? null : Math.max(0, Number(v)),
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
                          name="redemptionBillLimitPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Max redeemable (% of bill)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  variant="underline"
                                  type="number"
                                  min={0}
                                  max={100}
                                  step="0.01"
                                  placeholder="e.g. 20"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(
                                      v === ""
                                        ? null
                                        : Math.min(100, Math.max(0, Number(v))),
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
