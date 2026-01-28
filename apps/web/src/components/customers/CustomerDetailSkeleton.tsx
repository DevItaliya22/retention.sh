import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";

/**
 * Skeleton for customer detail page. Mirrors CustomerDetailPageClient layout.
 * Only dynamic content is skeletonized (per component-architecture).
 */
export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Profile header */}
      <Card className="overflow-hidden border-0 bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-36" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="size-4 rounded" />
              Contact & details
            </CardTitle>
            <CardDescription>Email, phone and basic info</CardDescription>
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
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="size-4 rounded" />
              Loyalty
            </CardTitle>
            <CardDescription>Points and membership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Skeleton className="size-4 rounded" />
            Bills
          </CardTitle>
          <CardDescription>Transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
