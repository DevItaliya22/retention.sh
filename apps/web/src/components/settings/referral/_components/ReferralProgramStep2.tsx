"use client";

import { ChannelSelector } from "@/components/common/form-sections/ChannelSelector";
import { useActiveSkusForSelect } from "@/hooks/sku/useSkusQuery";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";

const BENEFIT_TYPE_OPTIONS = [
  { value: "AMOUNT_CASHBACK", label: "Amount Cashback" },
  { value: "FREE_ITEM_ON_NEXT_PURCHASE", label: "Free Item on Next Visit" },
] as const;

export function ReferralProgramStep2() {
  const form = useFormContext<ReferralProgramFormValues>();
  const existingCustomerBenefitType = form.watch("existingCustomerBenefitType");
  const { data: skusData } = useActiveSkusForSelect();
  const skus = skusData?.items ?? [];

  const termsNew = form.watch("termsAndConditionsNewCustomer") ?? [];
  const termsExisting = form.watch("termsAndConditionsExistingCustomer") ?? [];

  const addTerm = (
    field:
      | "termsAndConditionsNewCustomer"
      | "termsAndConditionsExistingCustomer",
  ) => {
    const current = form.getValues(field) ?? [];
    form.setValue(field, [...current, ""]);
  };
  const removeTerm = (
    field:
      | "termsAndConditionsNewCustomer"
      | "termsAndConditionsExistingCustomer",
    index: number,
  ) => {
    const current = form.getValues(field) ?? [];
    form.setValue(
      field,
      current.filter((_: string, i: number) => i !== index),
    );
  };

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
          <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Lock referrer's reward until referred customer's first purchase
              </FormLabel>
              <p className="text-muted-foreground text-sm">
                Referrer&apos;s cashback will be locked until the person they
                referred makes their first bill at your business. Locked amount
                appears in bill redemption UI. The referred customer can use
                their reward normally.
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

      <div className="space-y-2">
        <FormLabel className="text-base">Notification channels</FormLabel>
        <p className="text-muted-foreground text-sm">
          How to notify referrer and referred customer when someone joins via
          referral
        </p>
        <ChannelSelector />
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

      <div className="space-y-4">
        <FormLabel>Terms for New Customers</FormLabel>
        {(termsNew.length === 0 ? [] : termsNew).map(
          (_: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`termsAndConditionsNewCustomer.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        variant="underline"
                        placeholder={`Point ${index + 1}`}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage variant="banner" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  removeTerm("termsAndConditionsNewCustomer", index)
                }
                className="mt-2 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTerm("termsAndConditionsNewCustomer")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add point
        </Button>
      </div>

      <div className="space-y-4">
        <FormLabel>Terms for Existing Customers</FormLabel>
        {(termsExisting.length === 0 ? [] : termsExisting).map(
          (_: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`termsAndConditionsExistingCustomer.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        variant="underline"
                        placeholder={`Point ${index + 1}`}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage variant="banner" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  removeTerm("termsAndConditionsExistingCustomer", index)
                }
                className="mt-2 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTerm("termsAndConditionsExistingCustomer")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add point
        </Button>
      </div>
    </div>
  );
}
