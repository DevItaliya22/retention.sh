"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  Button,
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";

export function LoyaltyProgramStep3() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  const terms = form.watch("termsAndConditions") ?? [""];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6">
        <FormField
          control={form.control}
          name="whatsappEnabled"
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
          name="emailEnabled"
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
          name="smsEnabled"
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
      <FormField
        control={form.control}
        name="termsAndConditions"
        render={() => (
          <FormItem>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Terms & conditions</span>
              {terms.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`termsAndConditions.${index}`}
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
                      const items = form.getValues("termsAndConditions") ?? [
                        "",
                      ];
                      const next = items.filter((_, i) => i !== index);
                      form.setValue(
                        "termsAndConditions",
                        next.length > 0 ? next : [""],
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
                  const items = form.getValues("termsAndConditions") ?? [""];
                  form.setValue("termsAndConditions", [...items, ""], {
                    shouldDirty: true,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add term
              </Button>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
