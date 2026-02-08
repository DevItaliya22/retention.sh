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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useForm,
} from "@reelo/ui/components";
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

const VISIT_INTERVAL_UNITS = [
  { value: "MINUTE", label: "Minute(s)", max: 60 },
  { value: "HOUR", label: "Hour(s)", max: 23 },
  { value: "DAY", label: "Day(s)", max: 31 },
  { value: "WEEK", label: "Week(s)", max: 4 },
  { value: "MONTH", label: "Month(s)", max: 12 },
] as const;

type VisitMadeConfig = NonNullable<LoyaltyResponse["visitMadeConfig"]>;

interface VisitMadeConfigSettingsCardProps {
  config: VisitMadeConfig;
  onSave: (payload: Partial<VisitMadeConfig>) => void;
  isSaving: boolean;
}

export function VisitMadeConfigSettingsCard({
  config,
  onSave,
  isSaving,
}: VisitMadeConfigSettingsCardProps) {
  const form = useForm({
    defaultValues: {
      pointsPerVisit: config.pointsPerVisit ?? 1,
      visitIntervalEnabled: config.visitIntervalEnabled ?? false,
      visitIntervalValue: config.visitIntervalValue ?? null,
      visitIntervalUnit: config.visitIntervalUnit ?? null,
    },
  });

  const handleSave = form.handleSubmit((values) => {
    onSave({
      pointsPerVisit: values.pointsPerVisit,
      visitIntervalEnabled: values.visitIntervalEnabled,
      visitIntervalValue: values.visitIntervalValue,
      visitIntervalUnit: values.visitIntervalUnit,
    });
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Visit configuration
        </CardTitle>
        <CardDescription className="text-xs">
          How customers earn points per visit
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-4 px-6 py-4">
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
                          {...field}
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
                      <FormLabel className="text-sm">
                        Require minimum time between visits to count as separate
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
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const unit = form.watch("visitIntervalUnit");
                                  const unitConfig = VISIT_INTERVAL_UNITS.find(
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
