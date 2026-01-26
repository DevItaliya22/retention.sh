"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";
import { BusinessExistingSettings } from "./BusinessExistingSettings";
import { BusinessOnboardingSettings } from "./BusinessOnboardingSettings";

function SettingsSkeleton() {
  return (
    <PageLayout
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="space-y-6">
          {/* Basic Information Skeleton */}
          <Card className="gap-0 p-0!">
            <CardHeader className="flex flex-col gap-0 border-b py-2!">
              <CardTitle className="text-base font-medium">
                Basic Information
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your business name and identifier
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Business Name</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    This is the primary name for your business.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Business Slug</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    This field is read-only.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>

          {/* Points & Currency Skeleton */}
          <Card className="gap-0 p-0!">
            <CardHeader className="flex flex-col gap-0 border-b py-2!">
              <CardTitle className="text-base font-medium">
                Points & Currency
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your loyalty points system and currency settings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Points Name</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    This will be displayed to customers when they earn or redeem
                    points.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Currency Symbol</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Common examples: ₹, $, €, £
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Currency Code</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Common examples: INR, USD, EUR, GBP
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>

          {/* Branding Skeleton */}
          <Card className="gap-0 p-0!">
            <CardHeader className="flex flex-col gap-0 border-b py-2!">
              <CardTitle className="text-base font-medium">Branding</CardTitle>
              <CardDescription className="text-xs">
                Customize your business appearance and messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Logo URL</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Enter a valid image URL for your business logo.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Theme Color</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Enter a hex color code (e.g., #7c3aed).
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Text Color</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Enter a hex color code for text (e.g., #ffffff).
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Banner Image URL</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    Enter a valid image URL for your business banner.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Header</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    This text appears prominently on customer-facing pages.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm">Subtitle</label>
                </div>
                <div className="col-span-8 flex flex-col gap-1">
                  <Skeleton className="h-9 w-full" />
                  <p className="text-foreground-lighter text-xs">
                    This text provides additional context or messaging.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}

export function BusinessSettingsContainer() {
  const { data, isLoading, isError } = useCurrentBusiness();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load business settings. Please try again later.
      </div>
    );
  }

  if (!data || !data.business) {
    return <BusinessOnboardingSettings />;
  }

  return <BusinessExistingSettings business={data.business} />;
}
