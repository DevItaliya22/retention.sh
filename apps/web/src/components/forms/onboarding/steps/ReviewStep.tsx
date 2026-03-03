"use client";

import { INDUSTRIES } from "@/lib/constants/industry";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import { buildCashierEmail } from "@/lib/utils/cashier-email";
import { useFormContext } from "@reelo/ui/components";

export function ReviewStep() {
  const form = useFormContext<WelcomeFormValues>();
  const values = form.getValues();

  const cashierEmail =
    values.cashierEmailLocalPart && values.cashierEmailSuffix
      ? buildCashierEmail(
          values.cashierEmailLocalPart,
          values.businessSlug,
          values.cashierEmailSuffix,
        )
      : "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review your details</h3>
        <p className="text-muted-foreground text-sm">
          Please make sure everything looks correct before proceeding.
        </p>
      </div>

      <div className="bg-muted/50 overflow-hidden rounded-xl border">
        <div className="border-b px-6 py-4">
          <h4 className="text-primary font-semibold">Business Information</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-6 text-sm">
          <div>
            <p className="text-muted-foreground">Business Name</p>
            <p className="font-medium">{values.businessName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Slug</p>
            <p className="font-medium">reelo.in/{values.businessSlug}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Currency</p>
            <p className="font-medium">
              {values.defaultCurrencyCode} ({values.defaultCurrencySymbol})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Points Name</p>
            <p className="font-medium">{values.defaultPointsName}</p>
          </div>
          {values.website && (
            <div>
              <p className="text-muted-foreground">Website</p>
              <p className="font-medium">{values.website}</p>
            </div>
          )}
          {Array.isArray(values.industries) && values.industries.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Industry</p>
              <p className="font-medium">
                {values.industries
                  .map((id) => INDUSTRIES.find((i) => i.id === id)?.label ?? id)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>

        {values.createCashier && (
          <>
            <div className="border-t border-b px-6 py-4">
              <h4 className="text-primary font-semibold">Cashier Setup</h4>
            </div>
            <div className="p-6 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <p className="text-muted-foreground">Cashier Name</p>
                  <p className="font-medium">{values.cashierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier Email</p>
                  <p className="font-medium">{cashierEmail}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
