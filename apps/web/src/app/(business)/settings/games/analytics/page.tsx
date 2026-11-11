import { GamesAnalyticsPageClient } from "@/components/settings/games/GamesAnalyticsPageClient";
import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata(
  "/settings/games/analytics",
);

export default function GamesAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Games analytics"
          subtitle="Participation and reward distribution"
        >
          <div className="bg-muted h-40 animate-pulse rounded-lg" />
        </SettingsPageFallback>
      }
    >
      <GamesAnalyticsPageClient />
    </Suspense>
  );
}
