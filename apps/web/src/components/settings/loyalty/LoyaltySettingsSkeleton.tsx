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

export function LoyaltySettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Earning & Redemption */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Earning & Redemption
          </CardTitle>
          <CardDescription className="text-xs">
            Points earning and redemption rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Earning percentage *</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Cashback branding</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Min purchase for earning</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Min purchase for redemption</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Limits & Expiry */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Limits & Expiry
          </CardTitle>
          <CardDescription className="text-xs">
            Caps and expiry settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Upper limit bill amount</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Upper limit claimable amount</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Point reminder days</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Point expiry days</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Communication & Terms */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Communication & Terms
          </CardTitle>
          <CardDescription className="text-xs">
            Channels and terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Notification channels</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-sm">WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-11 rounded-full" />
                <span className="text-sm">SMS</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Terms & conditions</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-3">
              <div className="flex gap-2 items-start">
                <Skeleton className="flex-1 min-h-[60px] rounded-md" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              </div>
              <div className="flex gap-2 items-start">
                <Skeleton className="flex-1 min-h-[60px] rounded-md" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>

      {/* Branding */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">Branding</CardTitle>
          <CardDescription className="text-xs">
            Customize your loyalty program appearance on customer-facing pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Logo URL</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Theme Color</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Text Color</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Banner Image URL</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Header</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Subtitle</Label>
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>
    </div>
  );
}
