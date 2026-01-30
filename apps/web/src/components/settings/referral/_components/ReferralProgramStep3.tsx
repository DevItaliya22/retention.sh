"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";

export function ReferralProgramStep3() {
  const form = useFormContext<ReferralProgramFormValues>();

  const values = form.watch();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Branding</h3>
          <p className="text-muted-foreground text-sm">
            Customize the appearance of your referral pages
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="branding.logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
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
                    placeholder="#7c3aed"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
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
                    placeholder="#ffffff"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
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
                    placeholder="https://..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="branding.header"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Header</FormLabel>
              <FormControl>
                <Input
                  placeholder="Welcome to our referral program"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
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
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
          <CardDescription>
            Review your referral program settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong>New Customer Benefit:</strong>{" "}
            {values.newCustomerBenefitType} - {values.newCustomerBenefitValue}
          </div>
          <div>
            <strong>Existing Customer Benefit:</strong>{" "}
            {values.existingCustomerBenefitType} -{" "}
            {values.existingCustomerBenefitValue}
          </div>
          <div>
            <strong>Information Sections:</strong>{" "}
            {values.informationSections?.length || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
