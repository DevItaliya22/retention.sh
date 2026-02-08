"use client";

import type { LoyaltyType } from "@/lib/schemas/loyalty";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Label,
  RadioGroup,
  RadioGroupItem,
  useFormContext,
} from "@reelo/ui/components";

const TYPES: {
  value: LoyaltyType;
  label: string;
  description: string;
  summary: string;
}[] = [
  {
    value: "CASHBACK",
    label: "Cashback",
    description:
      "Instant cashback on each bill — direct discount applied immediately.",
    summary:
      "Customers earn a percentage of their bill as cashback, applied instantly. No points system. Bill shows amount, cashback, and payable. Ideal for simple, transparent rewards.",
  },
  {
    value: "TIER",
    label: "Tier / Gamified",
    description: "Customers progress through tiers based on lifetime spending.",
    summary:
      "Higher lifetime spend unlocks better tiers with escalating cashback percentages. Tiers have spending ranges (e.g. ₹0–5k = Silver, ₹5k+ = Gold). Encourages repeat visits.",
  },
  {
    value: "AMOUNT_SPENT",
    label: "Amount Spent",
    description:
      "Points earned per bill amount — redeem for rewards (this bill only).",
    summary:
      "Customers earn points based on this bill's amount (not lifetime). Redeem points for free items, % off, or cash discount. Configurable reward stages. Good for bill-based milestones.",
  },
  {
    value: "VISIT_MADE",
    label: "Visit Made",
    description: "Points earned per visit — redeem for rewards.",
    summary:
      "Customers earn points per qualifying visit (1 visit = 1 bill). Optional visit interval to prevent gaming. Same reward types as Amount Spent (free item, % off, cash). Rewards loyalty frequency.",
  },
];

export function LoyaltyTypeStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="loyaltyType"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(v) => v && field.onChange(v as LoyaltyType)}
                className="space-y-4"
              >
                {TYPES.map((t) => (
                  <div key={t.value} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={t.value}
                        id={t.value}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={t.value}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {t.label}
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          {t.description}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
          Note
        </span>
        Once created, the loyalty type cannot be changed.
      </p>
    </div>
  );
}
