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

interface BrandingFormFieldsProps<T extends FieldValues> {
  /** Field prefix, e.g. "branding" for branding.logo, branding.themeColor, etc. */
  prefix?: FieldPath<T> | string;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

/** Reusable branding form fields (logo, themeColor, textColor, bannerImage, header, subtitle). */
export function BrandingFormFields<T extends FieldValues>({
  prefix = "branding",
  layout = "default",
}: BrandingFormFieldsProps<T>) {
  const form = useFormContext<T>();
  const p = String(prefix);
  const isSettings = layout === "settings";

  const fields = [
    {
      name: `${p}.logo` as FieldPath<T>,
      label: "Logo URL",
      placeholder: "https://...",
    },
    {
      name: `${p}.themeColor` as FieldPath<T>,
      label: "Theme Color",
      placeholder: "#7c3aed",
    },
    {
      name: `${p}.textColor` as FieldPath<T>,
      label: "Text Color",
      placeholder: "#ffffff",
    },
    {
      name: `${p}.bannerImage` as FieldPath<T>,
      label: "Banner Image URL",
      placeholder: "https://...",
    },
    {
      name: `${p}.header` as FieldPath<T>,
      label: "Header",
      placeholder: "Welcome to our loyalty program",
    },
    {
      name: `${p}.subtitle` as FieldPath<T>,
      label: "Subtitle",
      placeholder: "Earn points on every purchase",
    },
  ];

  return (
    <div className="space-y-4">
      {fields.map(({ name, label, placeholder }) => (
        <FormField
          key={String(name)}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
              {isSettings ? (
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">{label}</FormLabel>
                </div>
              ) : (
                <Label className="text-sm">{label}</Label>
              )}
              {isSettings ? (
                <div className={SETTINGS_CONTROL_CLASS}>
                  <FormControl>
                    <Input
                      variant="underline"
                      placeholder={placeholder}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : e.target.value,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              ) : (
                <>
                  <FormControl>
                    <Input
                      variant="underline"
                      placeholder={placeholder}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : e.target.value,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </>
              )}
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
