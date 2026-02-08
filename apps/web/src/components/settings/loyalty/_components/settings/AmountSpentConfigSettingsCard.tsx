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
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

type AmountSpentConfig = NonNullable<LoyaltyResponse["amountSpentConfig"]>;

interface AmountSpentConfigSettingsCardProps {
  config: AmountSpentConfig;
  onSave: (payload: Partial<AmountSpentConfig>) => void;
  isSaving: boolean;
}

export function AmountSpentConfigSettingsCard({
  config,
  onSave,
  isSaving,
}: AmountSpentConfigSettingsCardProps) {
  const form = useForm({
    defaultValues: {
      pointsPerRupee: config.pointsPerRupee ?? 1,
      onFinalAmount: config.onFinalAmount ?? false,
      maxPointsPerPurchase: config.maxPointsPerPurchase ?? null,
    },
  });

  const handleSave = form.handleSubmit((values) => {
    onSave({
      pointsPerRupee: values.pointsPerRupee,
      onFinalAmount: values.onFinalAmount,
      maxPointsPerPurchase: values.maxPointsPerPurchase,
    });
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Points configuration
        </CardTitle>
        <CardDescription className="text-xs">
          How customers earn points per bill
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-4 px-6 py-4">
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
                          {...field}
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
                      <FormLabel className="text-sm">
                        Earn points on final amount (after store discounts and
                        tax)
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
                          {...field}
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
