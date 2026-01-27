import {
  Card,
  CardContent,
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
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Bill number</p>
            <Skeleton className="mt-1 h-5 w-32" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Amount</p>
            <Skeleton className="mt-1 h-5 w-24" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Created</p>
            <Skeleton className="mt-1 h-4 w-28" />
          </div>
        </CardContent>
      </Card>
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
            <p className="text-muted-foreground text-sm">Phone</p>
            <Skeleton className="mt-1 h-5 w-28" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <Skeleton className="mt-1 h-5 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
