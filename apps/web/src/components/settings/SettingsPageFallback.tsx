import { DashboardPageShell } from "@/components/layouts";
import { Skeleton } from "@reelo/ui/components";
import type { ReactNode } from "react";

interface SettingsPageFallbackProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function SettingsPageFallback({
  title,
  subtitle,
  children,
}: SettingsPageFallbackProps) {
  return (
    <DashboardPageShell
      title={title}
      subtitle={subtitle}
      contentVariant="contained"
    >
      {children ?? (
        <div className="space-y-4 pb-8">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}
    </DashboardPageShell>
  );
}
