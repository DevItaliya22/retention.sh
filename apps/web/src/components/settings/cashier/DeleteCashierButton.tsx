"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@reelo/ui/components";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useManageCashier } from "@/hooks/cashier/useManageCashier";

interface DeleteCashierButtonProps {
  cashierId: string;
}

export function DeleteCashierButton({ cashierId }: DeleteCashierButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { delete: deleteCashier } = useManageCashier();

  const handleDelete = () => {
    setIsOpen(false);
    toast.promise(deleteCashier.mutateAsync(cashierId), {
      loading: "Deleting cashier...",
      success: "Cashier deleted successfully",
      error: (err) => err.message || "Failed to delete cashier",
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        icon={<Trash2 className="h-4 w-4" />}
        onClick={() => setIsOpen(true)}
      />
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cashier? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCashier.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCashier.isPending}
            >
              {deleteCashier.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
