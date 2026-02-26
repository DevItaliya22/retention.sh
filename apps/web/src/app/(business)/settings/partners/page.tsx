import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnersSettingsPageClient } from "./_components/PartnersSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/partners");

export default function PartnersSettingsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <PartnersSettingsPageClient />
    </Suspense>
  );
}
