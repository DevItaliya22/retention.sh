import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackSettingsPageClient } from "./_components/FeedbackSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/feedback");

export default function FeedbackSettingsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <FeedbackSettingsPageClient />
    </Suspense>
  );
}
