"use client";

import { TermsConditionsEditor } from "@/components/common/form-sections/TermsConditionsEditor";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormContext,
} from "@reelo/ui/components";

export function ReferralProgramStep3() {
  const form = useFormContext<ReferralProgramFormValues>();

  const values = form.watch();

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="termsAndConditionsNewCustomer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Terms for New Customers</FormLabel>
            <FormControl>
              <TermsConditionsEditor
                name={field.name}
                label="Terms for New Customers"
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="termsAndConditionsExistingCustomer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Terms for Existing Customers</FormLabel>
            <FormControl>
              <TermsConditionsEditor
                name={field.name}
                label="Terms for Existing Customers"
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />
    </div>
  );
}
