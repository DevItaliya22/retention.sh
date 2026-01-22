"use client";

import { useFormContext } from "@reelo/ui/components";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";

export function ReviewStep() {
  const form = useFormContext<WelcomeFormValues>();
  const values = form.getValues();

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
          <h4 className="font-semibold text-primary">Business Information</h4>
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
            <p className="font-medium">{values.defaultCurrencyCode} ({values.defaultCurrencySymbol})</p>
          </div>
          <div>
            <p className="text-muted-foreground">Points Name</p>
            <p className="font-medium">{values.defaultPointsName}</p>
          </div>
        </div>

        {values.createCashier && (
          <>
            <div className="border-t border-b px-6 py-4">
              <h4 className="font-semibold text-primary">Cashier Setup</h4>
            </div>
            <div className="p-6 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <p className="text-muted-foreground">Cashier Name</p>
                  <p className="font-medium">{values.cashierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier Email</p>
                  <p className="font-medium">{values.cashierEmail}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
