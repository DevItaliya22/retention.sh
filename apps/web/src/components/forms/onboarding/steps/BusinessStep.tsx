"use client";

import { useFormContext } from "@reelo/ui/components";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import { useEffect } from "react";
import { BusinessInfoFields } from "@/components/forms/shared/BusinessInfoFields";

export function BusinessStep() {
  const form = useFormContext<WelcomeFormValues>();
  const businessName = form.watch("businessName");

  // Auto-generate slug from name if slug is not touched
  useEffect(() => {
    if (businessName) {
      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      const currentSlug = form.getValues("businessSlug");
      if (!currentSlug || currentSlug === slug.slice(0, -1)) {
        form.setValue("businessSlug", slug, { shouldValidate: true });
      }
    }
  }, [businessName, form]);

  return <BusinessInfoFields control={form.control as any} />;
}
