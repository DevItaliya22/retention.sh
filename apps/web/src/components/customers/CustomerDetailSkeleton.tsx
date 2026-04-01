import { Skeleton } from "@reelo/ui/components";

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="from-muted/30 via-muted/10 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-56" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-px" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        <Skeleton className="my-5 h-px w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>

      {/* Activity */}
      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-muted/20 border-b px-6 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>
        <div className="space-y-3 p-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Bills */}
      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-muted/20 border-b px-6 py-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <div className="space-y-0 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b py-4 last:border-b-0"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="ml-auto h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
