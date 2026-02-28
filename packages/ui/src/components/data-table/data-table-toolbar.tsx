"use client";

import { cn } from "@reelo/ui/lib/utils";
import type { Column, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Input } from "../input";
import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { useDataTableToolbarActions } from "./data-table-toolbar-actions-context";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  maxTextFilters?: number;
}

export function DataTableToolbar<TData>({
  table,
  maxTextFilters,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const injectedActions = useDataTableToolbarActions();

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );
  const toolbarColumns = React.useMemo(() => {
    if (maxTextFilters === undefined) return columns;

    let textFilterCount = 0;
    return columns.filter((column) => {
      const variant = column.columnDef.meta?.variant;
      if (variant !== "text") return true;

      textFilterCount += 1;
      return textFilterCount <= Math.max(maxTextFilters, 0);
    });
  }, [columns, maxTextFilters]);

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full flex-wrap items-start justify-between gap-3 py-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {toolbarColumns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            className="border-border/60 bg-background/50 h-10 rounded-lg px-3 text-sm"
            icon={<X />}
            onClick={onReset}
          >
            Reset
          </Button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {injectedActions}
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  {
    const columnMeta = column.columnDef.meta;

    const onFilterRender = React.useCallback(() => {
      if (!columnMeta?.variant) return null;

      switch (columnMeta.variant) {
        case "text":
          return (
            <Input
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                const maxLength = columnMeta.maxLength ?? 255;
                if (value.length <= maxLength) {
                  column.setFilterValue(value);
                }
              }}
              maxLength={columnMeta.maxLength ?? 255}
              className="border-border/60 bg-background/50 placeholder:text-muted-foreground/75 h-10 w-full rounded-lg px-3 text-sm sm:w-[220px]"
            />
          );

        case "number":
          return (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn(
                  "border-border/60 bg-background/50 h-10 w-[140px] rounded-lg px-3 text-sm",
                  columnMeta.unit && "pr-8",
                )}
              />
              {columnMeta.unit && (
                <span className="bg-background/70 text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-lg px-2 text-sm">
                  {columnMeta.unit}
                </span>
              )}
            </div>
          );

        case "range":
          return (
            <DataTableSliderFilter
              column={column}
              title={columnMeta.label ?? column.id}
            />
          );

        case "date":
        case "dateRange":
          return (
            <DataTableDateFilter
              column={column}
              title={columnMeta.label ?? column.id}
              multiple={columnMeta.variant === "dateRange"}
            />
          );

        case "select":
        case "multiSelect":
          return (
            <DataTableFacetedFilter
              key={`${column.id}-${(columnMeta.options ?? []).length}`}
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === "multiSelect"}
            />
          );

        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}
