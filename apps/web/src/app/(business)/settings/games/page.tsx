import { GamesSettingsPageClient } from "@/components/settings/games/GamesSettingsPageClient";
import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/settings/games");

export default function GamesSettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Games of chance"
          subtitle="Configure spin wheel, lottery, and scratch campaigns"
        >
          <div className="bg-muted h-40 animate-pulse rounded-lg" />
        </SettingsPageFallback>
      }
    >
      <GamesSettingsPageClient />
    </Suspense>
  );
}
