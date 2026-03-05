import { DataTableSkeleton } from "@reelo/ui/components";

export function MessageLogsTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={6}
      rowCount={10}
      filterCount={1}
      withViewOptions
      withPagination
    />
  );
}
