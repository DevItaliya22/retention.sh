"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";

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

export function LoyaltyProgramStep2() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="upperLimitBillAmount"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Maximum bill amount considered for earning. Leave empty for no limit.">
              Upper limit bill amount
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder="No limit"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ||
                      Number.isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="upperLimitClaimableAmount"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Maximum amount customers can redeem in a single transaction. Leave empty for no limit.">
              Upper limit claimable amount
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                step="0.01"
                placeholder="No limit"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ||
                      Number.isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="pointReminderDays"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Send reminder to customers after this many days. Leave empty to disable.">
              Point reminder days
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={0}
                placeholder="Disabled"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ||
                      Number.isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="pointExpiryDays"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Points expire after this many days. Leave empty for never.">
              Point expiry days
            </LabelWithTooltip>
            <FormControl>
              <Input
                variant="underline"
                type="number"
                min={1}
                placeholder="Never expire"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ||
                      Number.isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
