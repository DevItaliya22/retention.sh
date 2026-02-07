"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Languages, Maximize2, Minimize2 } from "lucide-react";
import * as React from "react";
import { startTransition, useMemo, useRef, useState } from "react";
import { useDataGrid } from "../hooks/use-data-grid";
import { useFullscreen } from "../hooks/use-fullscreen";
import { getFilterFn } from "../lib/data-grid-filters";
import type { Direction } from "../types/data-grid";
import { Button } from "./button";
import { DataGrid } from "./data-grid/data-grid";
import { DataGridFilterMenu } from "./data-grid/data-grid-filter-menu";
import { DataGridRowHeightMenu } from "./data-grid/data-grid-row-height-menu";
import { DataGridSortMenu } from "./data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "./data-grid/data-grid-view-menu";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export interface SheetData {
  sheetName: string;
  columnData: string[];
  rowData: Array<Record<string, unknown>>;
}

export interface SheetViewerProps {
  sheetData: SheetData[];
  branding?: {
    id: string;
    title: string | null;
    mainLogo?: string | null;
    primaryColor?: string | null;
    backgroundColor?: string | null;
  } | null;
}

export function SheetViewer({
  sheetData,
  branding: _branding,
}: SheetViewerProps) {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(600);
  const [direction, setDirection] = useState<Direction>("ltr");
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenRef);

  // Ensure selectedSheetIndex is valid
  const validSheetIndex = Math.min(
    Math.max(0, selectedSheetIndex),
    Math.max(0, sheetData.length - 1),
  );
  const currentSheet = sheetData[validSheetIndex];

  // Update available height on mount and resize
  React.useEffect(() => {
    const updateHeight = () => {
      const navbarHeight = 80;
      const featureToolbarHeight = 50;
      const tabsHeight = sheetData.length > 1 ? 50 : 0;
      const calculatedHeight =
        window.innerHeight - navbarHeight - featureToolbarHeight - tabsHeight;
      setAvailableHeight(Math.max(400, calculatedHeight));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [sheetData.length]);

  // Sync selectedSheetIndex if it becomes invalid
  React.useEffect(() => {
    if (selectedSheetIndex >= sheetData.length && sheetData.length > 0) {
      setSelectedSheetIndex(0);
    }
  }, [selectedSheetIndex, sheetData.length]);

  // Create filter function following tablecn pattern
  const filterFn = useMemo(() => getFilterFn<Record<string, unknown>>(), []);

  // Helper function to calculate column width based on content
  const calculateColumnWidth = React.useCallback(
    (columnName: string, sampleData: Array<Record<string, unknown>>) => {
      const headerWidth = Math.max(columnName.length * 9 + 50, 100);

      const sampleValues = sampleData
        .slice(0, 20)
        .map((row) => {
          const value = row[columnName];
          if (value === null || value === undefined) return "";
          const str = String(value);
          return str.length > 100 ? str.substring(0, 100) : str;
        })
        .filter((v) => v.length > 0);

      if (sampleValues.length > 0) {
        const maxContentLength = Math.max(...sampleValues.map((v) => v.length));
        const contentWidth = Math.max(maxContentLength * 9 + 50, 100);
        return Math.min(Math.max(headerWidth, contentWidth), 400);
      }

      return Math.min(headerWidth, 300);
    },
    [],
  );

  // Create columns dynamically from columnData
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!currentSheet?.columnData) {
      return [];
    }

    const { rowData = [], columnData } = currentSheet;

    return columnData.map((columnName, index) => {
      const id = `sheet-${validSheetIndex}-col-${index}-${columnName}`;

      return {
        id,
        accessorKey: columnName,
        header: columnName,
        enableEditing: false,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn,
        meta: {
          label: columnName,
          cell: {
            variant: "short-text" as const,
          },
          showVariantIcon: false,
        },
        size: calculateColumnWidth(columnName, rowData),
        minSize: 100,
        maxSize: 600,
      };
    });
  }, [currentSheet, validSheetIndex, filterFn, calculateColumnWidth]);

  // Prepare data for DataGrid
  const gridData = useMemo(() => {
    if (!currentSheet || !currentSheet.rowData) {
      return [];
    }
    return currentSheet.rowData;
  }, [currentSheet]);

  // Use DataGrid hook following tablecn pattern
  const { table, ...dataGridProps } = useDataGrid({
    data: gridData,
    columns,
    readOnly: true,
    enableSearch: true,
    enablePaste: false,
    enableColumnSelection: false,
    dir: direction,
    initialState: {
      columnVisibility: {},
      sorting: [],
      columnFilters: [],
      rowSelection: {},
    },
  });

  const [isDataGridReady, setIsDataGridReady] = React.useState(true);
  const prevSheetIndexRef = React.useRef(validSheetIndex);

  React.useLayoutEffect(() => {
    if (prevSheetIndexRef.current !== validSheetIndex) {
      prevSheetIndexRef.current = validSheetIndex;
      setIsDataGridReady(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsDataGridReady(true);
          requestAnimationFrame(() => {
            startTransition(() => {
              const columnSizing: Record<string, number> = {};
              table.getAllColumns().forEach((column) => {
                if (column.getCanResize()) {
                  const calculatedSize = column.columnDef.size;
                  if (typeof calculatedSize === "number") {
                    columnSizing[column.id] = calculatedSize;
                  }
                }
              });
              if (Object.keys(columnSizing).length > 0) {
                table.setColumnSizing(columnSizing);
              }
            });
          });
        });
      });
    }
  }, [validSheetIndex, table]);

  // DataGrid feature buttons toolbar - DO NOT memoize (following tablecn best practices)
  const DirectionButton = (
    <Button
      variant="outline"
      className="h-8 min-w-8 px-2"
      icon={<Languages className="h-4 w-4" />}
      onClick={() => setDirection((prev) => (prev === "ltr" ? "rtl" : "ltr"))}
      tooltip={`Switch to ${direction === "ltr" ? "RTL" : "LTR"} direction`}
    >
      {direction === "ltr" ? "LTR" : "RTL"}
    </Button>
  );

  const FilterButton = (
    <DataGridFilterMenu table={table} align="end" className="w-[600px]" />
  );

  const SortButton = (
    <DataGridSortMenu table={table} align="end" className="w-[400px]" />
  );

  const ViewButton = <DataGridViewMenu table={table} align="end" />;

  const RowHeightButton = <DataGridRowHeightMenu table={table} />;

  if (!sheetData || sheetData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No sheet data available</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className="flex h-full flex-col">
      {/* DataGrid feature buttons toolbar */}
      <div className="border-border/40 bg-background flex items-center justify-end gap-2 border-b px-4 py-2">
        {DirectionButton}
        {FilterButton}
        {SortButton}
        {RowHeightButton}
        {ViewButton}
        <Button
          variant="secondary"
          className="h-8 min-w-8 px-2"
          icon={
            isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )
          }
          onClick={() => void toggleFullscreen()}
          tooltip={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden py-2">
          <div className="flex h-full flex-col">
            <div
              className="flex-1 overflow-hidden"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPaste={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onCut={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {isDataGridReady ? (
                <DataGrid
                  key={`sheet-${validSheetIndex}`}
                  {...dataGridProps}
                  table={table}
                  height={availableHeight}
                  className="h-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet tabs at the bottom */}
      {sheetData.length > 1 && (
        <div className="border-border/40 bg-background border-t px-4 py-2">
          <Tabs
            value={selectedSheetIndex.toString()}
            onValueChange={(value) => setSelectedSheetIndex(Number(value))}
          >
            <TabsList className="space-x-1 p-1">
              {sheetData.map((sheet, index) => (
                <TabsTrigger key={sheet.sheetName} value={index.toString()}>
                  {sheet.sheetName}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
}
