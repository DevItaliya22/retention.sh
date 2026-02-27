import {
  flexRender,
  type Row,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { Fragment } from "react";

import { getCommonPinningStyles } from "@reelo/ui/lib/data-table";
import { cn } from "@reelo/ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { DataTableDraggableRow } from "./data-table-draggable-row";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  enableReorder?: boolean;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
  tableType?: string; // Identifier to isolate drag/drop to same table type
  scrollMode?: "table" | "page";
  tableMaxHeight?: string;
  tableContainerClassName?: string;
  // Expandable row props
  enableExpanding?: boolean;
  expandedRows?: Set<string>;
  onExpandedRowsChange?: (expandedRows: Set<string>) => void;
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode;
  renderRowFooter?: (row: Row<TData>) => React.ReactNode;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  enableReorder = false,
  onReorder,
  tableType,
  scrollMode = "page",
  tableMaxHeight = "70vh",
  tableContainerClassName,
  enableExpanding = false,
  expandedRows: controlledExpandedRows,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onExpandedRowsChange,
  renderExpandedRow,
  renderRowFooter,
  getRowId,
  ...props
}: DataTableProps<TData>) {
  const [internalExpandedRows] = React.useState<Set<string>>(new Set());

  const isControlled = controlledExpandedRows !== undefined;
  const expandedRows = isControlled
    ? controlledExpandedRows
    : internalExpandedRows;
  const isTableScroll = scrollMode === "table";

  const getRowIdentifier = React.useCallback(
    (row: Row<TData>): string => {
      if (getRowId) {
        return getRowId(row.original);
      }
      return row.id;
    },
    [getRowId],
  );
  return (
    <div
      className={cn("flex w-full flex-col gap-3 overflow-visible", className)}
      {...props}
    >
      {children}
      <div className="bg-sidebar-accent/50 rounded-lg p-2">
        <div
          className={cn(
            "border-border/45 bg-background/55 rounded-lg border",
            isTableScroll ? "overflow-auto" : "overflow-hidden",
            tableContainerClassName,
          )}
          style={isTableScroll ? { maxHeight: tableMaxHeight } : undefined}
        >
          <Table className="[&_tbody_tr[data-state=selected]]:bg-sidebar-accent/35 [&_tbody_tr]:border-border/40 [&_tbody_tr]:hover:bg-sidebar-accent/20 [&_thead_th]:bg-background/65 [&_thead_th]:text-muted-foreground/95 [&_thead_tr]:border-border/50 [&_tbody_td]:px-4 [&_tbody_td]:py-4 [&_tbody_tr]:h-14 [&_thead_th]:h-12 [&_thead_th]:px-4 [&_thead_th]:text-xs [&_thead_th]:font-medium [&_thead_th]:tracking-wide">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        ...getCommonPinningStyles({ column: header.column }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const cells = row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getCommonPinningStyles({ column: cell.column }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ));

                  const rowId = getRowIdentifier(row);
                  const isExpanded = enableExpanding && expandedRows.has(rowId);
                  const rowFooter = renderRowFooter
                    ? renderRowFooter(row)
                    : null;

                  if (enableReorder && onReorder) {
                    return (
                      <Fragment key={row.id}>
                        <DataTableDraggableRow
                          row={row}
                          onReorder={onReorder}
                          tableType={tableType}
                          className={isExpanded ? "" : ""}
                        >
                          {cells}
                        </DataTableDraggableRow>
                        {rowFooter && (
                          <TableRow className="pointer-events-none">
                            <TableCell
                              colSpan={table.getAllColumns().length}
                              className="p-0"
                            >
                              {rowFooter}
                            </TableCell>
                          </TableRow>
                        )}
                        <AnimatePresence>
                          {isExpanded && renderExpandedRow && (
                            <TableRow>
                              <TableCell
                                colSpan={table.getAllColumns().length}
                                className="p-0"
                              >
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeInOut",
                                  }}
                                  style={{ overflow: "hidden" }}
                                  className="bg-sidebar-accent/20"
                                >
                                  <div className="p-6">
                                    {renderExpandedRow(row)}
                                  </div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  }

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className={
                          isExpanded ? "border-foreground/20 border-b-2" : ""
                        }
                      >
                        {cells}
                      </TableRow>
                      {rowFooter && (
                        <TableRow className="pointer-events-none">
                          <TableCell
                            colSpan={table.getAllColumns().length}
                            className="p-0"
                          >
                            {rowFooter}
                          </TableCell>
                        </TableRow>
                      )}
                      <AnimatePresence>
                        {isExpanded && renderExpandedRow && (
                          <TableRow>
                            <TableCell
                              colSpan={table.getAllColumns().length}
                              className="p-0"
                            >
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: "easeInOut",
                                }}
                                style={{ overflow: "hidden" }}
                                className="bg-sidebar-accent/20"
                              >
                                <div className="p-6">
                                  {renderExpandedRow(row)}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="text-muted-foreground h-32 text-center text-sm"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="pt-2">
          {table.getFilteredRowModel().rows.length > 0 && (
            <DataTablePagination table={table} />
          )}
          {actionBar &&
            table.getFilteredSelectedRowModel().rows.length > 0 &&
            actionBar}
        </div>
      </div>
    </div>
  );
}
