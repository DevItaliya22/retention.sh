import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CashierSettingPageClient } from "./_components/CashierSettingPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/cashier");

export default function CashierSettingPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <CashierSettingPageClient />
    </Suspense>
  );
}
