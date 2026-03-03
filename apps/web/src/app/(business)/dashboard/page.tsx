import { DashboardPageShell } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/dashboard");

export default async function DashboardPage() {
  return (
    <DashboardPageShell title="Dashboard" subtitle="Overview and insights">
      <div className="text-muted-foreground text-sm">
        Dashboard is coming soon.
      </div>
    </DashboardPageShell>
  );
}
