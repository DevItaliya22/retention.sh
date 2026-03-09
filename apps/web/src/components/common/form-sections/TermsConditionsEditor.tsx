"use client";

import {
  Button,
  FormField,
  FormItem,
  FormLabel,
  Input,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, X } from "lucide-react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { TermCard } from "./TermCard";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

interface TermsConditionsEditorProps<T extends FieldValues> {
  /** Field name for the terms array, e.g. "termsAndConditions" */
  name?: FieldPath<T>;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
  /** Optional preset labels to show as selectable suggestions */
  presetLabels?: string[];
  /** Custom label when layout is default */
  label?: string;
}

/** Reusable dynamic terms & conditions array editor. */
export function TermsConditionsEditor<T extends FieldValues>({
  name = "termsAndConditions" as FieldPath<T>,
  layout = "default",
  label: customLabel,
  presetLabels = [
    "Multiple offers cannot be combined in a single bill.",
    "Minimum purchase may be required for some rewards.",
    "Rewards are not redeemable on public holidays.",
    "Reward is redeemable in-store only.",
  ],
}: TermsConditionsEditorProps<T>) {
  const form = useFormContext<T>();
  const isSettings = layout === "settings";
  const presetSet = new Set(presetLabels);
  const terms = (form.watch(name) as string[] | undefined) ?? [];

  const content = (
    <div className="flex flex-col gap-2">
      {presetLabels.length > 0 && (
        <div className="mb-1 space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Suggested defaults
          </p>
          <div className="mt-1 grid gap-2 md:grid-cols-2">
            {presetLabels.map((label) => {
              const current = (form.getValues(name) as string[]) ?? [];
              const isSelected = current.includes(label);
              return (
                <TermCard
                  key={label}
                  label={label}
                  checked={isSelected}
                  onCheckedChange={(next) => {
                    const items = (form.getValues(name) as string[]) ?? [];
                    const exists = items.includes(label);
                    const nextItems = next
                      ? exists
                        ? items
                        : [...items, label]
                      : items.filter((t) => t !== label);
                    form.setValue(name, nextItems as T[FieldPath<T>], {
                      shouldDirty: true,
                    });
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
      {!isSettings && (
        <span className="text-sm font-medium">
          {customLabel ?? "Terms & conditions"}
        </span>
      )}
      {terms.map((_, index) => {
        const value =
          (form.getValues(
            `${String(name)}.${index}` as FieldPath<T>,
          ) as string) ?? "";
        if (presetSet.has(value)) {
          return null;
        }
        return (
          <div
            key={index}
            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"
          >
            <Input
              variant="underline"
              className="min-w-0 flex-1"
              value={value}
              placeholder={`Term ${index + 1}`}
              onChange={(e) => {
                const items = (form.getValues(name) as string[]) ?? [];
                const next = [...items];
                next[index] = e.target.value;
                form.setValue(name, next as T[FieldPath<T>], {
                  shouldDirty: true,
                });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => {
                const items = (form.getValues(name) as string[]) ?? [];
                const next = items.filter((_, i) => i !== index);
                form.setValue(name, next as T[FieldPath<T>], {
                  shouldDirty: true,
                });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const items = (form.getValues(name) as string[]) ?? [];
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
