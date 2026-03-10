"use client";

import { INDUSTRIES } from "@/lib/constants/industry";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import { buildCashierEmail } from "@/lib/utils/cashier-email";
import { Badge, Kbd, Separator, useFormContext } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import type React from "react";

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

  const industries =
    Array.isArray(values.industries) && values.industries.length > 0
      ? values.industries.map(
          (id) => INDUSTRIES.find((i) => i.id === id)?.label ?? id,
        )
      : [];

  const Field = (props: {
    label: string;
    value?: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div className={cn("space-y-1", props.className)}>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {props.label}
        </p>
        <div className="text-sm leading-snug font-medium">
          {props.value ?? (
            <span className="text-muted-foreground font-normal">—</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-background/70 relative overflow-hidden rounded-2xl border shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_30%_0%,hsl(var(--primary)/0.10),transparent_60%),radial-gradient(70%_60%_at_80%_20%,hsl(var(--primary)/0.08),transparent_55%)]" />

        <div className="relative space-y-6 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                Review before you finish
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Confirm these details. You can always change them later in
                settings.
              </p>
            </div>
            {/* <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/15">
              Final step
            </Badge> */}
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="bg-muted/30 rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold tracking-tight">
                  Business
                </h4>
                {/* <div className="text-muted-foreground text-xs">Step 1 & 2</div> */}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Business name" value={values.businessName} />
                <Field
                  label="Slug"
                  value={
                    values.businessSlug ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">
                          reelo.in/
                        </span>
                        <span className="font-semibold">
                          {values.businessSlug}
                        </span>
                      </span>
                    ) : undefined
                  }
                />
                <Field label="Website" value={values.website} />
                <Field
                  label="Currency"
                  value={
                    values.defaultCurrencyCode ? (
                      <>
                        {values.defaultCurrencyCode}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({values.defaultCurrencySymbol})
                        </span>
                      </>
                    ) : undefined
                  }
                />
                <Field label="Points name" value={values.defaultPointsName} />
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Industries
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {industries.length > 0 ? (
                      industries.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="rounded-full"
                        >
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm font-normal">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold tracking-tight">
                  Team setup
                </h4>
                {/* <div className="text-muted-foreground text-xs">Step 3</div> */}
              </div>

              <div className="mt-4">
                {values.createCashier ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cashier name" value={values.cashierName} />
                    <Field label="Cashier email" value={cashierEmail} />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    You chose to skip creating a cashier for now.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
            <div></div>
            <p className="flex items-center gap-2">
              Press <Kbd>Enter</Kbd> to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
