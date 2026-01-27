import { DataTableSkeleton } from "@reelo/ui/components";

/**
 * Server-safe skeleton for the bills table. No hooks, no useSearchParams.
 * Use as fallback for dynamic import / Suspense.
 */
export function BillsTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={5}
      rowCount={10}
      filterCount={1}
      withViewOptions
      withPagination
    />
  );
}
