"use client";

import { cn } from "@reelo/ui/lib/utils";
import type { Column } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  EyeOff,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<TData, TValue>;
  label: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{label}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "focus:ring-ring text-foreground/95 hover:bg-background/55 data-[state=open]:bg-background/65 [&_svg]:text-muted-foreground -ml-1.5 flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:ring-1 focus:outline-none [&_svg]:size-4 [&_svg]:shrink-0",
          className,
        )}
        {...props}
      >
        {label}
        {column.getCanSort() &&
          (column.getIsSorted() === "desc" ? (
            <ChevronDown />
          ) : column.getIsSorted() === "asc" ? (
            <ChevronUp />
          ) : (
            <ChevronsUpDown />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        {column.getCanSort() && (
          <>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "asc"}
              onClick={() => column.toggleSorting(false)}
            >
              <ChevronUp />
              Asc
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <ChevronDown />
              Desc
            </DropdownMenuCheckboxItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.clearSorting()}
              >
                <X />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeOff />
            Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
