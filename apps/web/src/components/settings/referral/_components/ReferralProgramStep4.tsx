"use client";

import { BrandingImageUploadFormField } from "@/components/common/form-sections/BrandingFormFields";
import { ReferralPreviewPanel } from "@/components/settings/referral/_components/ReferralPreviewPanel";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { ReferralProgram } from "@/hooks/referral/useReferralProgram";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import { resolveServiceBranding } from "@/lib/utils/service-branding";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useFormContext,
} from "@reelo/ui/components";
import { useEffect, useMemo } from "react";

export function ReferralProgramStep4() {
  const form = useFormContext<ReferralProgramFormValues>();
  const { data: businessData } = useCurrentBusiness();
  const business = businessData?.business;
  const watchedBranding = form.watch("branding");

  const previewBranding = resolveServiceBranding({
    branding: watchedBranding ?? null,
    defaultBranding: business?.defaultBranding ?? null,
    useDefaultBrandingForServices: business?.useDefaultBrandingForServices,
  });

  const previewProgram = useMemo<ReferralProgram>(
    () => ({
      id: "preview-referral-program",
      businessId: business?.id ?? "preview-business",
      isEnabled: true,
      newCustomerBenefitType: form.getValues("newCustomerBenefitType"),
      newCustomerBenefitValue: form.getValues("newCustomerBenefitValue") ?? 0,
      newCustomerBenefitExpiresInDays:
        form.getValues("newCustomerBenefitExpiresInDays") ?? null,
      newCustomerFreeItemSkuId:
        form.getValues("newCustomerFreeItemSkuId") ?? null,
      newCustomerFreeItemSku: null,
      existingCustomerBenefitType: form.getValues(
        "existingCustomerBenefitType",
      ),
      existingCustomerBenefitValue:
        form.getValues("existingCustomerBenefitValue") ?? 0,
      existingCustomerBenefitExpiresInDays:
        form.getValues("existingCustomerBenefitExpiresInDays") ?? null,
      existingCustomerFreeItemSkuId:
        form.getValues("existingCustomerFreeItemSkuId") ?? null,
      existingCustomerFreeItemSku: null,
      lockReferralPointsUntilFirstPurchase:
        form.getValues("lockReferralPointsUntilFirstPurchase") ?? false,
      whatsappEnabled: form.getValues("whatsappEnabled") ?? true,
      emailEnabled: form.getValues("emailEnabled") ?? false,
      smsEnabled: form.getValues("smsEnabled") ?? false,
      sendReminderToCustomer: form.getValues("sendReminderToCustomer") ?? false,
      reminderDelayDays: form.getValues("reminderDelayDays") ?? null,
      informationSections: [],
      branding: previewBranding,
      termsAndConditionsNewCustomer: [],
      termsAndConditionsExistingCustomer: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [business?.id, form, previewBranding],
  );

  useEffect(() => {
    if (!business?.useDefaultBrandingForServices) return;

    const resolved = resolveServiceBranding({
      branding: form.getValues("branding"),
      defaultBranding: business.defaultBranding ?? null,
      useDefaultBrandingForServices: true,
    });

    form.setValue("branding", resolved, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [business, form]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <div className="grid gap-6">
        <BrandingImageUploadFormField<ReferralProgramFormValues>
          name="branding.logo"
          label="Logo"
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
                  placeholder="#8651e1"
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
                <Input
                  variant="underline"
                  placeholder="Earn rewards by referring friends"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage variant="banner" />
            </FormItem>
          )}
        />
      </div>

      <div className="border-border/45 bg-background/55 rounded-lg border p-4">
        <ReferralPreviewPanel
          brandingValues={previewBranding}
          referralProgram={previewProgram}
          previewBusinessName={business?.name ?? "Business"}
        />
      </div>
    </div>
  );
}
