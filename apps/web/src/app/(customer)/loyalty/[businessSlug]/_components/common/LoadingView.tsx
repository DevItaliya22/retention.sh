"use client";

import { Skeleton } from "@reelo/ui/components";
import { MobileLayout } from "./MobileLayout";

export function LoadingView() {
  return (
    <MobileLayout>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </header>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </MobileLayout>
  );
}
