"use client";

import { cn } from "@reelo/ui/lib/utils";
import { GripVertical } from "lucide-react";

interface DataTableDragHandleProps {
  className?: string;
}

/**
 * Visual drag handle indicator for reorderable table rows.
 * The actual drag functionality is handled by the row component.
 */
export function DataTableDragHandle({ className }: DataTableDragHandleProps) {
  return (
    <div
      className={cn(
        "text-foreground-lighter hover:text-foreground flex cursor-grab items-center justify-center p-2 transition-colors",
        className,
      )}
      role="button"
      tabIndex={0}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
}
