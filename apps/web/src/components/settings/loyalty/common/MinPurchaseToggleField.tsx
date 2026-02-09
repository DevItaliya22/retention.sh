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
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "./settings-layout";

interface MinPurchaseToggleFieldProps<T extends FieldValues> {
  enabledName: FieldPath<T>;
  valueName: FieldPath<T>;
  label: string;
  tooltip?: string;
  placeholder?: string;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

/** Toggle + value pattern: when enabled, show number input. */
export function MinPurchaseToggleField<T extends FieldValues>({
  enabledName,
  valueName,
  label,
  tooltip,
  placeholder = "0",
  layout = "default",
}: MinPurchaseToggleFieldProps<T>) {
  const form = useFormContext<T>();
  const isSettings = layout === "settings";

  const controlContent = (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name={enabledName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <label className="flex cursor-pointer items-center gap-2">
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
                {!isSettings && (
                  <span className="text-sm font-normal">{label}</span>
                )}
                {tooltip && (
                  <span
                    className="text-muted-foreground text-xs"
                    title={tooltip}
                    onClick={(e) => e.stopPropagation()}
                  >
                    (i)
                  </span>
                )}
              </label>
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
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder={placeholder}
                disabled={!form.watch(enabledName)}
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
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  if (isSettings) {
    return (
      <div className={SETTINGS_ROW_CLASS}>
        <div className={SETTINGS_LABEL_CLASS}>
          <FormLabel className="text-sm">{label}</FormLabel>
        </div>
        <div className={SETTINGS_CONTROL_CLASS}>{controlContent}</div>
      </div>
    );
  }

  return <div className="space-y-2">{controlContent}</div>;
}
