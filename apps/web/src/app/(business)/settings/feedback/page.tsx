import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { FeedbackSettingsSkeleton } from "@/components/settings/feedback/FeedbackSettingsSkeleton";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackSettingsPageClient } from "./_components/FeedbackSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/feedback");

export default function FeedbackSettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Feedback"
          subtitle="Configure when and how to collect customer feedback"
        >
          <FeedbackSettingsSkeleton />
        </SettingsPageFallback>
      }
    >
      <FeedbackSettingsPageClient />
    </Suspense>
  );
}
