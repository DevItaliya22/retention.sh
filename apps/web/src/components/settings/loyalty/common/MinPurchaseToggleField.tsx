"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
  useFormContext,
} from "@reelo/ui/components";
import type { FieldPath, FieldValues } from "react-hook-form";
import {
  numericInputHandlers,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

interface MinPurchaseToggleFieldProps<T extends FieldValues> {
  enabledName: FieldPath<T>;
  valueName: FieldPath<T>;
  label: string;
  /** Optional subheading below the label (referral-style) */
  valueLabel?: string;
  tooltip?: string;
  placeholder?: string;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

/** Referral-style: left heading + subheading, right switch; then labeled amount input. */
export function MinPurchaseToggleField<T extends FieldValues>({
  enabledName,
  valueName,
  label,
  valueLabel = "Minimum amount (₹)",
  tooltip,
  placeholder = "0",
  layout = "default",
}: MinPurchaseToggleFieldProps<T>) {
  const form = useFormContext<T>();
  const isSettings = layout === "settings";
  const enabled = form.watch(enabledName);

  if (isSettings) {
    return (
      <div className="space-y-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <FormLabel className="text-sm">{label}</FormLabel>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <FormField
              control={form.control}
              name={enabledName}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            const current = form.getValues(valueName as never);
                            if (
                              current == null ||
                              (typeof current === "string" && current === "")
                            ) {
                              form.setValue(valueName as never, 0 as never);
                            }
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {enabled && (
          <FormField
            control={form.control}
            name={valueName}
            render={({ field }) => (
              <FormItem className={SETTINGS_ROW_CLASS}>
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">{valueLabel}</FormLabel>
                </div>
                <div className={SETTINGS_CONTROL_CLASS}>
                  <FormControl>
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={placeholder}
                      disabled={!enabled}
                      value={
                        field.value === null ||
                        field.value === undefined ||
                        field.value === 0
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                      {...numericInputHandlers}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}
      </div>
    );
  }

  const controlContent = (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={enabledName}
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between gap-4 border-b py-4">
            <div className="min-w-0 space-y-0.5">
              <FormLabel>{label}</FormLabel>
              {tooltip && (
                <p
                  className="text-muted-foreground max-w-md text-sm"
                  title={tooltip}
                >
                  {tooltip}
                </p>
              )}
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    const current = form.getValues(valueName as never);
                    if (
                      current == null ||
                      (typeof current === "string" && current === "")
                    ) {
                      form.setValue(valueName as never, 0 as never);
                    }
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={valueName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{valueLabel}</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder={placeholder}
                disabled={!enabled}
                value={
                  field.value === null ||
                  field.value === undefined ||
                  field.value === 0
                    ? ""
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || Number.isNaN(Number(raw))) {
                    field.onChange(null);
                    return;
                  }
                  field.onChange(Math.max(0, Number(raw)));
                }}
                {...numericInputHandlers}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return <div className="space-y-2">{controlContent}</div>;
}
