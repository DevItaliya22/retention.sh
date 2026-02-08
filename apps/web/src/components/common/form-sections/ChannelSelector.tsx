"use client";

import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormContext,
} from "@reelo/ui/components";
import type { FieldPath, FieldValues } from "react-hook-form";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

interface ChannelSelectorProps<T extends FieldValues> {
  whatsappName?: FieldPath<T>;
  emailName?: FieldPath<T>;
  smsName?: FieldPath<T>;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

const DEFAULT_NAMES = {
  whatsappName: "whatsappEnabled",
  emailName: "emailEnabled",
  smsName: "smsEnabled",
} as const;

/** Reusable channel checkboxes (WhatsApp, Email, SMS) for loyalty, membership, etc. */
export function ChannelSelector<T extends FieldValues>({
  whatsappName = DEFAULT_NAMES.whatsappName as FieldPath<T>,
  emailName = DEFAULT_NAMES.emailName as FieldPath<T>,
  smsName = DEFAULT_NAMES.smsName as FieldPath<T>,
  layout = "default",
}: ChannelSelectorProps<T>) {
  const form = useFormContext<T>();
  const isSettings = layout === "settings";

  const checkboxes = (
    <div className="flex flex-wrap gap-6">
      <FormField
        control={form.control}
        name={whatsappName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <span className="text-sm">WhatsApp</span>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={emailName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <span className="text-sm">Email</span>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={smsName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <span className="text-sm">SMS</span>
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
          <FormLabel className="text-sm">Notification channels</FormLabel>
        </div>
        <div className={SETTINGS_CONTROL_CLASS}>{checkboxes}</div>
      </div>
    );
  }

  return checkboxes;
}
