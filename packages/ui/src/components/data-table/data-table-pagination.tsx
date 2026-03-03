import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { cn } from "@reelo/ui/lib/utils";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showRowSelectionCount?: boolean;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showRowSelectionCount = false,
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const currentRowsCount = table.getRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();

  const startRow = currentRowsCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = pageIndex * pageSize + currentRowsCount;
  const estimatedTotalRows =
    pageCount <= 0
      ? endRow
      : pageIndex === pageCount - 1
        ? endRow
        : pageCount * pageSize;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 px-2 pt-2 pb-1 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground text-sm whitespace-nowrap">
        {showRowSelectionCount
          ? `${selectedCount} of ${table.getFilteredRowModel().rows.length} row(s) selected.`
          : selectedCount > 0
            ? `${selectedCount} of ${table.getFilteredRowModel().rows.length} row(s) selected.`
            : ``}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end lg:gap-5">
        <div className="flex items-center space-x-2">
          <p className="text-sm whitespace-nowrap">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="border-border/60 bg-background/55 h-9 w-[76px] rounded-lg data-size:h-9">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm whitespace-nowrap">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon"
            className="border-border/60 bg-background/55 hidden size-9 rounded-lg lg:flex"
            icon={<ChevronsLeft />}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          />
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="border-border/60 bg-background/55 size-9 rounded-lg"
            icon={<ChevronLeft />}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="border-border/60 bg-background/55 size-9 rounded-lg"
            icon={<ChevronRight />}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="border-border/60 bg-background/55 hidden size-9 rounded-lg lg:flex"
            icon={<ChevronsRight />}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          />
        </div>
      </div>
    </div>
  );
}
