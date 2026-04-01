"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Skeleton } from "@reelo/ui/components";

export function LoyaltyLoadingView() {
  return (
    <PageLayout
      title="Loyalty"
      subtitle="Loading..."
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer className="bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10 pb-8">
          <section className="grid grid-cols-1 gap-6 border-b border-black/10 pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                PRIVATE CLIENT
              </p>
              <Skeleton className="h-12 w-56" />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <span>Current tier:</span>
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
              <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                CASHBACK BALANCE
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-light tabular-nums sm:text-5xl">
                  ₹
                </span>
                <Skeleton className="h-12 w-40" />
              </div>
              <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                <span>Earning</span>
                <Skeleton className="h-4 w-8" />
                <span>on every transaction.</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
            <div className="space-y-8 lg:col-span-8">
              <article className="bg-card rounded-md border p-6">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                      TIER PROGRESSION
                    </p>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs italic">
                      <span>Next:</span>
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                  <div className="relative space-y-6 pt-8 pb-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-3 w-8" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="mx-auto h-3 w-28" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
            <aside className="space-y-6 lg:col-span-4">
              <article className="bg-card space-y-4 rounded-md border p-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                    LEDGER
                  </p>
                  <Skeleton className="size-4 rounded-full" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`ledger-skeleton-${index}`}
                      className="flex items-start justify-between gap-3 border-b border-black/10 pb-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-black/10 pt-3">
                  <Skeleton className="h-3 w-28" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="size-7 rounded-md" />
                    <Skeleton className="size-7 rounded-md" />
                  </div>
                </div>
              </article>
              <article className="bg-card space-y-3 rounded-md border p-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                    LIFETIME VALUE
                  </p>
                  <Skeleton className="size-4 rounded-full" />
                </div>
                <Skeleton className="h-10 w-40" />
                <p className="text-muted-foreground text-sm">
                  Total portfolio spend across your relationship.
                </p>
              </article>
            </aside>
          </section>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
