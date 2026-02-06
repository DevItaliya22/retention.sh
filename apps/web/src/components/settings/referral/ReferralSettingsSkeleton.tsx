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

export function ReferralSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* New Customer Benefits */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            New Customer Benefits
          </CardTitle>
          <CardDescription className="text-xs">
            Rewards for customers who join through a referral link
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Benefit Type</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Benefit Value</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Expires In (Days)</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Existing Customer Benefits */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Existing Customer Benefits
          </CardTitle>
          <CardDescription className="text-xs">
            Rewards for customers who refer others
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Benefit Type</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Benefit Value</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Expires In (Days)</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Send Reminder */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">Send Reminder</CardTitle>
          <CardDescription className="text-xs">
            Send reminder notifications to customers about their referral
            rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row items-center justify-between px-6 py-4">
          <span className="text-sm">Send reminder to customer</span>
          <Skeleton className="h-6 w-11 rounded-full" />
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">Branding</CardTitle>
          <CardDescription className="text-xs">
            Customize appearance of referral pages
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Logo URL</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Image URL for your logo.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Theme Color</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Hex color (e.g. #7c3aed).
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Text Color</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Hex color for text.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Banner Image URL</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Image URL for banner.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Header</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Main heading on referral pages.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Label className="text-sm">Subtitle</Label>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
              <p className="text-foreground-lighter text-xs">
                Subheading or short description.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Terms - New Customer */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Terms & Conditions (New Customer)
          </CardTitle>
          <CardDescription className="text-xs">
            Terms shown to new customers who join via referral
          </CardDescription>
        </CardHeader>
        <CardContent className="border-b px-6 py-4 space-y-3">
          <div className="flex gap-2 items-start">
            <Skeleton className="flex-1 min-h-[60px] rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          </div>
          <div className="flex gap-2 items-start">
            <Skeleton className="flex-1 min-h-[60px] rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Terms - Existing Customer */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Terms & Conditions (Existing Customer)
          </CardTitle>
          <CardDescription className="text-xs">
            Terms for existing customers who refer others
          </CardDescription>
        </CardHeader>
        <CardContent className="border-b px-6 py-4 space-y-3">
          <div className="flex gap-2 items-start">
            <Skeleton className="flex-1 min-h-[60px] rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          </div>
          <div className="flex gap-2 items-start">
            <Skeleton className="flex-1 min-h-[60px] rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>
    </div>
  );
}
