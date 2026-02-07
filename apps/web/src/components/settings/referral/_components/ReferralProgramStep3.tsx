"use client";

import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";

const textareaUnderlineClass =
  "border-input min-h-20 border-0 border-b rounded-none bg-transparent resize-none px-0 py-3 shadow-none focus-visible:ring-0";

export function ReferralProgramStep3() {
  const form = useFormContext<ReferralProgramFormValues>();

  const values = form.watch();

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="branding.logo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logo URL</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.themeColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Theme Color</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#7c3aed"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.textColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Color</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#ffffff"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.bannerImage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image URL</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.header"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Header</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="Welcome to our referral program"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Earn rewards by referring friends"
                className={textareaUnderlineClass}
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <div className="bg-muted/50 overflow-hidden rounded-xl border">
        <div className="border-b px-6 py-4">
          <h4 className="text-primary font-semibold">Review</h4>
        </div>
        <div className="space-y-4 p-6 text-sm">
          <div>
            <p className="text-muted-foreground">New Customer Benefit</p>
            <p className="font-medium">
              {values.newCustomerBenefitType} – {values.newCustomerBenefitValue}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Existing Customer Benefit</p>
            <p className="font-medium">
              {values.existingCustomerBenefitType} –{" "}
              {values.existingCustomerBenefitValue}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Information Sections</p>
            <p className="font-medium">
              {values.informationSections?.length ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
