import { cn } from "@reelo/ui/lib/utils";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

interface DataTableSkeletonProps extends React.ComponentProps<"div"> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: string[];
  withViewOptions?: boolean;
  withPagination?: boolean;
  shrinkZero?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  filterCount = 0,
  cellWidths = ["auto"],
  withViewOptions = true,
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? "auto",
  );

  return (
    <div
      className={cn("flex w-full flex-col gap-3 overflow-visible", className)}
      {...props}
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-3 py-1">
        <div className="flex flex-1 items-center gap-2">
          {filterCount > 0
            ? Array.from({ length: filterCount }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-[220px] rounded-lg" />
              ))
            : null}
        </div>
        {withViewOptions ? (
          <Skeleton className="ml-auto hidden h-10 w-20 rounded-lg lg:flex" />
        ) : null}
      </div>
      <div className="bg-sidebar-accent/50 rounded-lg p-2">
        <div className="border-border/45 bg-background/55 overflow-hidden rounded-lg border">
          <Table className="[&_tbody_tr]:border-border/40 [&_thead_th]:bg-background/65 [&_thead_th]:text-muted-foreground/95 [&_thead_tr]:border-border/50 [&_tbody_td]:px-4 [&_tbody_td]:py-4 [&_tbody_tr]:h-14 [&_thead_th]:h-12 [&_thead_th]:px-4 [&_thead_th]:text-xs [&_thead_th]:font-medium [&_thead_th]:tracking-wide">
            <TableHeader>
              {Array.from({ length: 1 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableHead
                      key={j}
                      style={{
                        width: cozyCellWidths[j],
                        minWidth: shrinkZero ? cozyCellWidths[j] : "auto",
                      }}
                    >
                      <Skeleton className="h-6 w-full" />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableCell
                      key={j}
                      style={{
                        width: cozyCellWidths[j],
                        minWidth: shrinkZero ? cozyCellWidths[j] : "auto",
                      }}
                    >
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {withPagination ? (
          <div className="flex w-full flex-col gap-3 px-2 pt-2 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-5 w-24 shrink-0" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-9 w-[76px] rounded-lg" />
              </div>
              <Skeleton className="h-5 w-20" />
              <div className="flex items-center gap-2">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="hidden size-9 rounded-lg lg:block" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
