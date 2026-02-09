"use client";

import { BrandingFormFields } from "@/components/common/form-sections";

export function BrandingStep() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Customize appearance on customer-facing loyalty pages.
      </p>
      <BrandingFormFields prefix="branding" />
    </div>
  );
}
