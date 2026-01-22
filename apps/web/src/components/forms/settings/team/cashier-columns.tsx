"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@reelo/ui/components";
import { Pencil, Trash2 } from "lucide-react";
import { Cashier } from "@/lib/swr/use-cashiers";

interface CashierColumnsProps {
  onEdit: (cashier: Cashier) => void;
  onDelete: (cashier: Cashier) => void;
  isDeleting?: boolean;
}

export function createCashierColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: CashierColumnsProps): ColumnDef<Cashier>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "linkSlug",
      header: "Link Slug",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const cashier = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(cashier)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(cashier)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
