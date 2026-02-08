"use client";

import type { LoyaltyType } from "@/lib/schemas/loyalty";
import { loyaltyTypeSchema } from "@/lib/schemas/loyalty";
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

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

export const LOYALTY_SKELETON_STORAGE_KEY = "dy:loyalty-skeleton-type";

export function isValidLoyaltySkeletonType(
  value: unknown,
): value is LoyaltyType {
  return loyaltyTypeSchema.safeParse(value).success;
}

interface LoyaltySettingsSkeletonProps {
  loyaltyType?: LoyaltyType;
}

export function LoyaltySettingsSkeleton({
  loyaltyType,
}: LoyaltySettingsSkeletonProps) {
  const type =
    loyaltyType && isValidLoyaltySkeletonType(loyaltyType)
      ? loyaltyType
      : "CASHBACK";

  return (
    <div className="space-y-6 pb-12">
      {type === "CASHBACK" && <CashbackSkeleton />}
      {type === "TIER" && (
        <>
          <TierConfigSkeleton />
          <TiersSkeleton />
        </>
      )}
      {type === "AMOUNT_SPENT" && (
        <>
          <AmountSpentSkeleton />
          <RewardStagesSkeleton />
        </>
      )}
      {type === "VISIT_MADE" && (
        <>
          <VisitMadeSkeleton />
          <RewardStagesSkeleton />
        </>
      )}
      <CommonSettingsSkeleton />
      <BrandingSkeleton />
    </div>
  );
}

function CashbackSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Cashback configuration
        </CardTitle>
        <CardDescription className="text-xs">
          Cashback percentage, earning/redemption rules, and limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Cashback percentage</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Calculate cashback on final amount (after store discounts and tax)
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Max cashback per bill (₹) — leave empty for no cap
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Min purchase for earning</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-11 rounded-full" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Min purchase for redemption</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-11 rounded-full" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        </div>
        <div className="space-y-4 border-t pt-6">
          <div className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <Label className="text-sm">
                Redemption limits on wallet balance
              </Label>
              <p className="text-muted-foreground text-xs">
                Cap how much of their cashback balance a customer can use at
                once.
              </p>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-11 rounded-full" />
                <Label className="text-sm font-normal">
                  Limit redemption on wallet balance
                </Label>
              </div>
            </div>
          </div>
          <div className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <Label className="text-sm">
                Redemption limits on bill amount
              </Label>
              <p className="text-muted-foreground text-xs">
                Cap redemption relative to the current bill total.
              </p>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-11 rounded-full" />
                <Label className="text-sm font-normal">
                  Limit redemption on bill amount
                </Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function TierConfigSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Tier configuration
        </CardTitle>
        <CardDescription className="text-xs">
          Points conversion and global cap
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Points per rupee spent (default)</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Max cashback cap per transaction (global fallback)
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-11 rounded-full" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function TiersSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Manage tiers</CardTitle>
        <CardDescription className="text-xs">
          Add, edit, or remove tiers based on lifetime spending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <p className="text-muted-foreground text-sm">
          Higher rank = better tier. Customers progress based on lifetime spend.
        </p>
        <div className="space-y-4">
          <Skeleton className="min-h-[120px] w-full rounded-md" />
          <Skeleton className="min-h-[120px] w-full rounded-md" />
        </div>
        <Skeleton className="h-9 w-36" />
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function AmountSpentSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Points configuration
        </CardTitle>
        <CardDescription className="text-xs">
          How customers earn points per bill
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Points per rupee spent</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Earn points on final amount (after store discounts and tax)
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Max points per purchase — leave empty for no cap
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function VisitMadeSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Visit configuration
        </CardTitle>
        <CardDescription className="text-xs">
          How customers earn points per visit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Points per visit</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">
              Require minimum time between visits to count as separate
            </Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function RewardStagesSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Reward stages</CardTitle>
        <CardDescription className="text-xs">
          Configure redeemable rewards at different point thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <p className="text-muted-foreground text-sm">
          Customers redeem points for these rewards.
        </p>
        <div className="space-y-4">
          <Skeleton className="min-h-[140px] w-full rounded-md" />
          <Skeleton className="min-h-[140px] w-full rounded-md" />
        </div>
        <Skeleton className="h-9 w-36" />
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function CommonSettingsSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Expiry, Channels & Terms
        </CardTitle>
        <CardDescription className="text-xs">
          Point reminders, expiry, notification channels, and terms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Point reminder days</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Point expiry days</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Notification channels</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <div className="flex flex-wrap gap-6">
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
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Terms & conditions</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Skeleton className="min-h-[60px] flex-1 rounded-md" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="min-h-[60px] flex-1 rounded-md" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}

function BrandingSkeleton() {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Branding</CardTitle>
        <CardDescription className="text-xs">
          Customize your loyalty program appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-4">
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Logo URL</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Theme Color</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Text Color</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Banner Image URL</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Header</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className={SETTINGS_ROW_CLASS}>
          <div className={SETTINGS_LABEL_CLASS}>
            <Label className="text-sm">Subtitle</Label>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t px-6 py-4">
        <Skeleton className="h-9 w-32" />
      </CardFooter>
    </Card>
  );
}
