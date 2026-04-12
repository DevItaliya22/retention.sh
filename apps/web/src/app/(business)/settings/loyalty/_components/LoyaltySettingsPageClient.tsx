"use client";

import { DashboardPageShell } from "@/components/layouts";
import { LoyaltyProgramForm } from "@/components/settings/loyalty/_components/LoyaltyProgramForm";
import { LoyaltyExistingSettings } from "@/components/settings/loyalty/LoyaltyExistingSettings";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useLoyaltySettingsQuery } from "@/hooks/loyalty/useLoyaltySettings";
import { LOYALTY_ONBOARDED_KEY } from "@/lib/constants/settings-storage";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@reelo/ui/components";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoyaltySettingsPageClient() {
  const router = useRouter();
  const { data: businessData } = useCurrentBusiness();
  const { data: loyaltyData } = useLoyaltySettingsQuery();
  const hasLoyalty = !!loyaltyData?.loyalty;
  const loyaltyEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "loyalty") ??
    false;

  useEffect(() => {
    if (loyaltyData === undefined) return;
    try {
      window.localStorage.setItem(
        LOYALTY_ONBOARDED_KEY,
        JSON.stringify(!!loyaltyData?.loyalty),
      );
    } catch {
      // ignore
    }
  }, [loyaltyData]);

  if (loyaltyData === undefined) {
    return (
      <DashboardPageShell
        title="Loyalty Settings"
        subtitle="Configure earning, redemption, expiry, and communication"
        contentVariant="contained"
        tourAnchor="onboarding-tour-loyalty"
      >
        <LoyaltySettingsSkeleton />
      </DashboardPageShell>
    );
  }

  if (loyaltyEnabled && !hasLoyalty) {
    return (
      <DashboardPageShell
        title="Loyalty Settings"
        subtitle="Set up earning, redemption, expiry, and communication"
        contentVariant="contained"
        tourAnchor="onboarding-tour-loyalty"
      >
        <LoyaltyProgramForm initialData={null} embedded />
      </DashboardPageShell>
    );
  }

  const subtitle = !loyaltyEnabled
    ? "Loyalty is disabled for this business"
    : "Configure earning, redemption, expiry, and communication";

  return (
    <DashboardPageShell
      title="Loyalty Settings"
      subtitle={subtitle}
      contentVariant="contained"
      tourAnchor="onboarding-tour-loyalty"
    >
      {!loyaltyEnabled ? (
        <Empty className="min-h-[200px]">
          <EmptyHeader>
            <EmptyTitle>Enable it in General settings first</EmptyTitle>
            <EmptyDescription>
              Turn on &quot;Loyalty enabled&quot; to set up or use the loyalty
              program.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="default" onClick={() => router.push("/settings")}>
              Go to General settings
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <LoyaltyExistingSettings />
      )}
    </DashboardPageShell>
  );
}
