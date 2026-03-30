"use client";

import { BrandingImageUploadFormField } from "@/components/common/form-sections/BrandingFormFields";
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

export function ReferralProgramStep4() {
  const form = useFormContext<ReferralProgramFormValues>();

  return (
    <div className="grid gap-6">
      <BrandingImageUploadFormField<ReferralProgramFormValues>
        name="branding.logo"
        label="Logo"
        uploadKind="logo"
        formMessageVariant="banner"
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

      <BrandingImageUploadFormField<ReferralProgramFormValues>
        name="branding.bannerImage"
        label="Banner image"
        uploadKind="banner"
        formMessageVariant="banner"
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
    </div>
  );
}
