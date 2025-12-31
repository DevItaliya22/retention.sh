"use client";

import { DropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "@reelo/ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import * as React from "react";
import { TableCell, TableRow } from "../table";

interface DataTableDraggableRowProps<TData> {
  row: Row<TData>;
  children: React.ReactNode;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
  isDragging?: boolean;
  tableType?: string; // Identifier to isolate drag/drop to same table type
  className?: string;
}

export function DataTableDraggableRow<TData>({
  row,
  children,
  onReorder,
  isDragging: isDraggingProp,
  tableType,
  className,
}: DataTableDraggableRowProps<TData>) {
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isOver, setIsOver] = React.useState(false);
  const [dropIndicatorData, setDropIndicatorData] = React.useState<{
    type: "insert-above" | "insert-below";
  } | null>(null);

  const rowIndex = row.index;

  React.useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ rowIndex, rowId: row.id, tableType }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
          setIsOver(false);
          setDropIndicatorData(null);
        },
      }),
      dropTargetForElements({
        element,
        getData: () => ({ rowIndex, rowId: row.id, tableType }),
        canDrop: ({ source }) => {
          // Only allow drops within the same table type
          const sourceTableType = source.data.tableType as string | undefined;
          if (tableType && sourceTableType !== tableType) {
            return false;
          }
          return source.data.rowIndex !== rowIndex;
        },
        onDragEnter: ({ location }) => {
          setIsOver(true);
          // Determine if drop is above or below based on mouse position
          const rect = element.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const mouseY = location.current.input.clientY;
          setDropIndicatorData({
            type: mouseY < midpoint ? "insert-above" : "insert-below",
          });
        },
        onDrag: ({ location }) => {
          // Update drop indicator position as user moves mouse
          const rect = element.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const mouseY = location.current.input.clientY;
          setDropIndicatorData({
            type: mouseY < midpoint ? "insert-above" : "insert-below",
          });
        },
        onDragLeave: () => {
          setIsOver(false);
          setDropIndicatorData(null);
        },
        onDrop: ({ source }) => {
          setIsOver(false);
          setDropIndicatorData(null);
          const sourceIndex = source.data.rowIndex as number;
          const destinationIndex = rowIndex;
          if (
            typeof sourceIndex === "number" &&
            typeof destinationIndex === "number" &&
            sourceIndex !== destinationIndex &&
            onReorder
          ) {
            onReorder(sourceIndex, destinationIndex);
          }
        },
      }),
    );
  }, [rowIndex, row.id, onReorder, tableType]);

  return (
    <>
      {dropIndicatorData?.type === "insert-above" && (
        <TableRow className="pointer-events-none">
          <TableCell colSpan={100} className="relative h-0 p-0">
            <div className="absolute inset-x-0 top-0">
              <DropIndicator edge="top" />
            </div>
          </TableCell>
        </TableRow>
      )}
      <TableRow
        ref={rowRef}
        data-state={row.getIsSelected() && "selected"}
        className={cn(
          "relative cursor-grab active:cursor-grabbing",
          isDragging || isDraggingProp ? "cursor-grabbing opacity-50" : "",
          isOver ? "bg-muted" : "",
          className,
        )}
      >
        {children}
      </TableRow>
      {dropIndicatorData?.type === "insert-below" && (
        <TableRow className="pointer-events-none">
          <TableCell colSpan={100} className="relative h-0 p-0">
            <div className="absolute inset-x-0 top-0">
              <DropIndicator edge="top" />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
