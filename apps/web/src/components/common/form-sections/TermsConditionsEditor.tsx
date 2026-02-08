"use client";

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import type { FieldPath, FieldValues } from "react-hook-form";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

interface TermsConditionsEditorProps<T extends FieldValues> {
  /** Field name for the terms array, e.g. "termsAndConditions" */
  name?: FieldPath<T>;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

/** Reusable dynamic terms & conditions array editor. */
export function TermsConditionsEditor<T extends FieldValues>({
  name = "termsAndConditions" as FieldPath<T>,
  layout = "default",
}: TermsConditionsEditorProps<T>) {
  const form = useFormContext<T>();
  const terms = (form.watch(name) as string[] | undefined) ?? [""];
  const isSettings = layout === "settings";

  const content = (
    <div className="flex flex-col gap-2">
      {!isSettings && (
        <span className="text-sm font-medium">Terms & conditions</span>
      )}
      {terms.map((_, index) => (
        <div key={index} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name={`${String(name)}.${index}` as FieldPath<T>}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    variant="underline"
                    placeholder={`Term ${index + 1}`}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const items = (form.getValues(name) as string[]) ?? [""];
              const next = items.filter((_, i) => i !== index);
              form.setValue(
                name,
                (next.length > 0 ? next : [""]) as T[FieldPath<T>],
                { shouldDirty: true },
              );
            }}
            className="mt-2 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const items = (form.getValues(name) as string[]) ?? [""];
          form.setValue(name, [...items, ""] as T[FieldPath<T>], {
            shouldDirty: true,
          });
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add term
      </Button>
    </div>
  );

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
          {isSettings ? (
            <>
              <div className={SETTINGS_LABEL_CLASS}>
                <FormLabel className="text-sm">Terms & conditions</FormLabel>
              </div>
              <div className={SETTINGS_CONTROL_CLASS}>{content}</div>
            </>
          ) : (
            content
          )}
        </FormItem>
      )}
    />
  );
}
