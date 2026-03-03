import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";

/**
 * Skeleton for bill detail page. Mirrors BillDetailPageClient layout.
 */
export function BillDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-muted/20 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Bill & customer card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bill & customer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <Skeleton className="h-3.5 w-12" />
            <div className="mt-3 space-y-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-3.5 w-16" />
            <div className="mt-3 space-y-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 rounded-lg border p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
