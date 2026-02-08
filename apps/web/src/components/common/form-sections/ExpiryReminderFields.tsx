"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import type { FieldPath, FieldValues } from "react-hook-form";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

interface ExpiryReminderFieldsProps<T extends FieldValues> {
  reminderName?: FieldPath<T>;
  expiryName?: FieldPath<T>;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

const DEFAULT_NAMES = {
  reminderName: "pointReminderDays",
  expiryName: "pointExpiryDays",
} as const;

/** Reusable expiry & reminder number fields (pointReminderDays, pointExpiryDays). */
export function ExpiryReminderFields<T extends FieldValues>({
  reminderName = DEFAULT_NAMES.reminderName as FieldPath<T>,
  expiryName = DEFAULT_NAMES.expiryName as FieldPath<T>,
  layout = "default",
}: ExpiryReminderFieldsProps<T>) {
  const form = useFormContext<T>();
  const isSettings = layout === "settings";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={reminderName}
        render={({ field }) => (
          <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
            {isSettings ? (
              <div className={SETTINGS_LABEL_CLASS}>
                <FormLabel className="text-sm">Point reminder days</FormLabel>
              </div>
            ) : (
              <Label className="text-sm">Point reminder days</Label>
            )}
            {isSettings ? (
              <div className={SETTINGS_CONTROL_CLASS}>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    placeholder="Disabled"
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
              </div>
            ) : (
              <>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    placeholder="Disabled"
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
              </>
            )}
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={expiryName}
        render={({ field }) => (
          <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
            {isSettings ? (
              <div className={SETTINGS_LABEL_CLASS}>
                <FormLabel className="text-sm">Point expiry days</FormLabel>
              </div>
            ) : (
              <Label className="text-sm">Point expiry days</Label>
            )}
            {isSettings ? (
              <div className={SETTINGS_CONTROL_CLASS}>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={1}
                    placeholder="Never expire"
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
                      field.onChange(Math.max(1, Number(raw)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </div>
            ) : (
              <>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={1}
                    placeholder="Never expire"
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
                      field.onChange(Math.max(1, Number(raw)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}
