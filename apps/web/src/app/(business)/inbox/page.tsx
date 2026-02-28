import { DashboardPageShell } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/inbox");

export default async function InboxPage() {
  return (
    <DashboardPageShell title="Inbox" subtitle="Messages and updates">
      <div className="text-muted-foreground text-sm">Inbox is coming soon.</div>
    </DashboardPageShell>
  );
}
