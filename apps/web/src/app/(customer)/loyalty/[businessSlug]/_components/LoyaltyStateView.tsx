"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";

type LoyaltyStateViewProps = {
  subtitle: string;
  message: string;
  destructive?: boolean;
};

export function LoyaltyStateView({
  subtitle,
  message,
  destructive = false,
}: LoyaltyStateViewProps) {
  return (
    <PageLayout
      title="Loyalty"
      subtitle={subtitle}
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <p
            className={
              destructive
                ? "text-destructive text-sm font-medium"
                : "text-muted-foreground text-sm"
            }
          >
            {message}
          </p>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
