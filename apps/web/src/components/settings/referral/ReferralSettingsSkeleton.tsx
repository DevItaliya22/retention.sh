"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Skeleton,
} from "@reelo/ui/components";

const ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

export function ReferralSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* New Customer Benefits - NestedCard, static title/description/labels */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            New Customer Benefits
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Rewards for customers who join through a referral link
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Benefit Type</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Cashback Amount (₹)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Free Item</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Expires In (Days)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Existing Customer Benefits */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Existing Customer Benefits
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Rewards for customers who refer others
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Benefit Type</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Cashback Amount (₹)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Free Item</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Expires In (Days)</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Send Reminder - SettingsField-style toggle, no footer */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Send Reminder
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Send reminder notifications to customers about their referral
            rewards
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex flex-row items-center justify-between px-4 py-4">
            <span className="text-sm">Send reminder to customer</span>
            <Skeleton className="h-6 w-11 rounded-full" />
          </CardContent>
        </Card>
      </Card>

      {/* Branding - match SettingsFieldGroup title/description exactly */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Branding
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Customize appearance of referral pages
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Logo URL</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Image URL for your logo.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Theme Color</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Hex color (e.g. #7c3aed).
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Text Color</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Hex color for text.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Banner Image URL</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Image URL for banner.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Header</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Main heading on referral pages.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Subtitle</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Subheading or short description.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Terms & Conditions (New Customer) - match TermsCard exactly */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Terms & Conditions (New Customer)
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Terms shown to new customers who join via referral
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-3 overflow-auto px-4 py-4">
            <div className="flex items-start gap-2">
              <Skeleton className="min-h-[60px] flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="min-h-[60px] flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Terms & Conditions (Existing Customer) */}
      <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Terms & Conditions (Existing Customer)
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Terms for existing customers who refer others
          </CardDescription>
        </CardHeader>
        <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-3 overflow-auto px-4 py-4">
            <div className="flex items-start gap-2">
              <Skeleton className="min-h-[60px] flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="min-h-[60px] flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>
    </div>
  );
}
