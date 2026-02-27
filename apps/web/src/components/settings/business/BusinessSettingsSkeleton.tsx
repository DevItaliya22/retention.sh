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

export function BusinessSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Basic Information - 4 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Basic Information
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Manage your business name, identifier, website, and next bill number
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Business Name</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  This is the primary name for your business.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Business Slug</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  This field is read-only.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Website</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Your business website URL (optional).
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Next Bill Number</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Auto-fills the bill number in the cashier form. Increments
                  automatically when a bill is created.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Points & Currency - 4 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Points & Currency
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Configure your loyalty points system and currency settings
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Points Name</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  This will be displayed to customers when they earn or redeem
                  points.
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Currency Symbol</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Common examples: ₹, $, €, £
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Currency Code</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Common examples: INR, USD, EUR, GBP
                </p>
              </div>
            </div>
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Registration bonus points</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Bonus points given when a customer registers from the loyalty
                  login page. Set to 0 to disable.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Branding - 6 fields */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Branding
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Customize your business appearance and messaging
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
            <div className={ROW_CLASS}>
              <div className={LABEL_CLASS}>
                <Label className="text-sm">Logo URL</Label>
              </div>
              <div className={CONTROL_CLASS}>
                <Skeleton className="h-9 w-full" />
                <p className="text-foreground-lighter text-xs">
                  Enter a valid image URL for your business logo.
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
                  Enter a hex color code (e.g., #7c3aed).
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
                  Enter a hex color code for text (e.g., #ffffff).
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
                  Enter a valid image URL for your business banner.
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
                  This text appears prominently on customer-facing pages.
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
                  This text provides additional context or messaging.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
            <Skeleton className="h-9 w-32" />
          </CardFooter>
        </Card>
      </Card>

      {/* Services - 3 toggles */}
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Services
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Enable or disable loyalty, referral, and feedback for your business
          </CardDescription>
        </CardHeader>
        <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
          <CardContent className="flex flex-col divide-y px-4 py-4">
            <div className="flex flex-col gap-1 py-4 first:pt-0">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Loyalty</span>
                  <span className="text-muted-foreground text-xs">
                    Points and rewards
                  </span>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col gap-1 py-4">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Referral</span>
                  <span className="text-muted-foreground text-xs">
                    Referral program (requires loyalty)
                  </span>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col gap-1 py-4">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Feedback</span>
                  <span className="text-muted-foreground text-xs">
                    Feedback links on bills
                  </span>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Card>
    </div>
  );
}
