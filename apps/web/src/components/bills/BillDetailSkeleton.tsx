import { Skeleton } from "@reelo/ui/components";

export function BillDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="from-muted/30 via-muted/10 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-40 sm:w-48" />
          </div>
          <div className="flex items-end gap-6 sm:gap-8">
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-3 w-28" />
              <Skeleton className="ml-auto h-10 w-32" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Two-column: Breakdown + Customer */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="bg-card rounded-2xl border p-6 shadow-sm">
          <Skeleton className="mb-5 h-4 w-36" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
        <div className="bg-card rounded-2xl border p-6 shadow-sm lg:max-w-[340px]">
          <Skeleton className="mb-5 h-4 w-24" />
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-muted/20 border-b px-6 py-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-0 p-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b py-4 last:border-b-0"
            >
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="ml-auto h-5 w-8" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
