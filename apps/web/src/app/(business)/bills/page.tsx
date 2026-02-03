import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { BillsPageClient } from "./_components/BillsPageClient";

export const metadata: Metadata = generateRouteMetadata("/bills");

export default function BillsPage() {
  return <BillsPageClient />;
}
