import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";

/**
 * Skeleton for bill detail page. Mirrors BillDetailPageClient layout.
 * Only dynamic content is skeletonized (per component-architecture).
 */
export function BillDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Bill header */}
      <Card className="overflow-hidden border-0 bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="size-4 rounded" />
              Bill details
            </CardTitle>
            <CardDescription>Number, amount and date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Skeleton className="size-4 rounded" />
                Customer
              </CardTitle>
              <CardDescription>Linked customer for this bill</CardDescription>
            </div>
            <Skeleton className="h-8 w-28 shrink-0 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
