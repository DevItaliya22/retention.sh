"use client";

import { INDUSTRIES } from "@/lib/constants/industry";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import {
  Button,
  FormField,
  FormItem,
  useFormContext,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";

// Split into rows for width disparity: middle rows wider, first/last narrower
const ROW_1 = INDUSTRIES.slice(0, 4); // 4 items
const ROW_2 = INDUSTRIES.slice(4, 8); // 4 items
const ROW_3 = INDUSTRIES.slice(8, 12); // 4 items
const ROW_4 = INDUSTRIES.slice(12); // 1 item (Other...)

const ROWS: { items: typeof INDUSTRIES; widthClass: string }[] = [
  { items: ROW_1, widthClass: "max-w-2xl" },
  { items: ROW_2, widthClass: "max-w-4xl" },
  { items: ROW_3, widthClass: "max-w-4xl" },
  { items: ROW_4, widthClass: "max-w-2xl" },
];

export function IndustryStep() {
  const form = useFormContext<WelcomeFormValues>();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="industries"
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value)
            ? field.value
            : [];
          const toggle = (id: string) => {
            const next = selected.includes(id)
              ? selected.filter((x) => x !== id)
              : [...selected, id];
            field.onChange(next);
          };
          return (
            <FormItem>
              <div className="flex flex-col gap-4">
                {ROWS.map(({ items, widthClass }, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={cn("flex flex-wrap gap-2", widthClass)}
                  >
                    {items.map(({ id, label }) => {
                      const isSelected = selected.includes(id);
                      return (
                        <Button
                          key={id}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-auto min-h-10 shrink-0 rounded-full px-4 py-2 text-left font-normal transition-[border-color,background-color]",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-muted-foreground/40",
                          )}
                          onClick={() => toggle(id)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}
