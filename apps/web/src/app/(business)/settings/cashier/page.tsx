import { CashierSettingPageClient } from "./_components/CashierSettingPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/settings/cashier");

export default function CashierSettingPage() {
  return <CashierSettingPageClient />;
}
