"use client";

import { Button } from "@reelo/ui/components";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
  label = "items",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3">
      <p className="text-muted-foreground text-xs">
        Page {page} of {totalPages} ({totalItems} {label})
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
