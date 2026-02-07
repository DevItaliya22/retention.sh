"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";

function LabelWithTooltip({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm">{children}</Label>
      <span className="text-muted-foreground text-xs" title={tooltip}>
        (i)
      </span>
    </div>
  );
}

export function LoyaltyProgramStep1() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="earningPercentage"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Percentage of the bill amount that customers earn as loyalty points (0–100).">
              Earning percentage *
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={
                  field.value === 0 ||
                  field.value === null ||
                  field.value === undefined
                    ? ""
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || Number.isNaN(Number(raw))) {
                    field.onChange(0);
                    return;
                  }
                  const n = Math.min(100, Math.max(0, Number(raw)));
                  field.onChange(n);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cashbackBranding"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="A friendly name for your points (e.g. cookies, chillies).">
              Cashback branding
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                placeholder="e.g. cookies, chillies"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="minPurchaseForEarning"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Minimum bill amount required to earn any points.">
              Min purchase for earning
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                value={
                  field.value === 0 ||
                  field.value === null ||
                  field.value === undefined
                    ? ""
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || Number.isNaN(Number(raw))) {
                    field.onChange(0);
                    return;
                  }
                  const n = Math.max(0, Number(raw));
                  field.onChange(n);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="minPurchaseForRedemption"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Minimum bill amount required to redeem points.">
              Min purchase for redemption
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                value={
                  field.value === 0 ||
                  field.value === null ||
                  field.value === undefined
                    ? ""
                    : field.value
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || Number.isNaN(Number(raw))) {
                    field.onChange(0);
                    return;
                  }
                  const n = Math.max(0, Number(raw));
                  field.onChange(n);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="earnPointsOnPaidAmountOnly"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <Label className="text-sm font-normal">
              Earn points on paid amount only (recommended)
            </Label>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
