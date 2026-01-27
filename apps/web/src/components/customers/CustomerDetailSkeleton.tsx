import {
  Card,
  CardContent,
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
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Name</p>
              <Skeleton className="mt-1 h-5 w-40" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <Skeleton className="mt-1 h-5 w-48" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Phone</p>
              <Skeleton className="mt-1 h-5 w-28" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loyalty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Points balance</p>
              <Skeleton className="mt-1 h-5 w-16" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Member since</p>
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
