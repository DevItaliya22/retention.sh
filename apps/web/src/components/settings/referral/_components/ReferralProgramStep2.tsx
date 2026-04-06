"use client";

import { useActiveSkusForSelect } from "@/hooks/sku/useSkusQuery";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useFormContext,
} from "@reelo/ui/components";

const BENEFIT_TYPE_OPTIONS = [
  { value: "AMOUNT_CASHBACK", label: "Amount Cashback" },
  { value: "FREE_ITEM_ON_NEXT_PURCHASE", label: "Free Item on Next Visit" },
] as const;

export function ReferralProgramStep2() {
  const form = useFormContext<ReferralProgramFormValues>();
  const existingCustomerBenefitType = form.watch("existingCustomerBenefitType");
  const { data: skusData } = useActiveSkusForSelect();
  const skus = skusData?.items ?? [];
  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="existingCustomerBenefitType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Benefit Type <span className="text-foreground">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue placeholder="Select benefit type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {BENEFIT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      {existingCustomerBenefitType === "AMOUNT_CASHBACK" && (
        <FormField
          control={form.control}
          name="existingCustomerBenefitValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cashback Amount (₹) <span className="text-foreground">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  variant="underline"
                  placeholder="50"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </FormControl>
              <FormMessage variant="banner" />
            </FormItem>
          )}
        />
      )}

      {existingCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE" && (
        <FormField
          control={form.control}
          name="existingCustomerFreeItemSkuId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Free Item <span className="text-foreground">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={skus.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {skus.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.sku ? `(${s.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage variant="banner" />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="lockReferralPointsUntilFirstPurchase"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-6">
            <div className="space-y-0.5">
              <FormLabel className="text-sm">
                Lock referrer's reward until referred customer's first purchase
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Referrer&apos;s cashback will be locked until the person they
                referred makes their first bill. Locked amount shows in bill
                redemption UI.
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <FormLabel className="text-base">Notification channels</FormLabel>
        <p className="text-muted-foreground text-sm">
          How to notify referrer and referred customer when someone joins via
          referral
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="whatsappEnabled"
            render={({ field }) => (
              <FormItem className="border-border/60 bg-background/70 flex items-center justify-between rounded-xl border p-4">
                <div>
                  <Label className="text-sm font-medium">WhatsApp</Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Send referral updates on WhatsApp
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailEnabled"
            render={({ field }) => (
              <FormItem className="border-border/60 bg-background/70 flex items-center justify-between rounded-xl border p-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Send referral updates by email
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="smsEnabled"
            render={({ field }) => (
              <FormItem className="border-border/60 bg-background/70 flex items-center justify-between rounded-xl border p-4">
                <div>
                  <Label className="text-sm font-medium">SMS</Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Send referral updates through SMS
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="existingCustomerBenefitExpiresInDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expires In (Days)</FormLabel>
            <FormControl>
              <Input
                type="number"
                variant="underline"
                placeholder="30 (optional)"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />
    </div>
  );
}
