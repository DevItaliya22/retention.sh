import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";

/**
 * Skeleton for customer detail page. Mirrors CustomerDetailPageClient layout.
 */
export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary hero */}
      <div className="bg-muted/20 rounded-xl border px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="mt-2 h-5 w-36" />
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-40" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bills card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bills</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
