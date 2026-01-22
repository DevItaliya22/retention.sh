"use client";

import { useCashiers } from "@/lib/swr/use-cashiers";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@reelo/ui/components";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCashierColumns } from "./cashier-columns";
import { CashierModal } from "./CashierModal";

export function CashierSettingsStep() {
  const {
    cashiers,
    isLoading,
    create,
    update,
    delete: deleteCashier,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCashiers();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cashierToDelete, setCashierToDelete] = useState<any>(null);

  const handleEdit = (cashier: any) => {
    setSelectedCashier(cashier);
    setModalOpen(true);
  };

  const handleDelete = (cashier: any) => {
    setCashierToDelete(cashier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cashierToDelete) return;

    try {
      await deleteCashier(cashierToDelete.id);
      toast.success(`Cashier ${cashierToDelete.name} deleted!`);
      setDeleteDialogOpen(false);
      setCashierToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete cashier");
    }
  };

  const handleModalSubmit = async (values: any) => {
    try {
      if (selectedCashier) {
        await update(selectedCashier.id, {
          cashierName: values.cashierName,
          cashierEmail: values.cashierEmail,
          cashierLinkSlug: values.cashierLinkSlug,
        });
        toast.success(`Cashier ${values.cashierName} updated!`);
        setModalOpen(false);
        setSelectedCashier(null);
      } else {
        await create({
          cashierName: values.cashierName,
          cashierEmail: values.cashierEmail,
          cashierLinkSlug: values.cashierLinkSlug,
          cashierPassword: values.cashierPassword,
        });
        toast.success(`Cashier ${values.cashierName} added!`);
        setModalOpen(false);
        setSelectedCashier(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save cashier");
      throw error;
    }
  };

  const columns = useMemo(
    () =>
      createCashierColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        isDeleting,
      }),
    [isDeleting],
  );

  const table = useReactTable({
    data: cashiers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cashiers</CardTitle>
              <CardDescription>
                Manage your team members. Password changes are restricted here
                for security.
              </CardDescription>
            </div>
            <Button onClick={() => setModalOpen(true)} size="sm">
              Add Cashier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="bg-muted/20 border-border/50 rounded-xl border-2 border-dashed py-12 text-center">
              <p className="text-muted-foreground">Loading cashiers...</p>
            </div>
          ) : cashiers.length === 0 ? (
            <div className="bg-muted/20 border-border/50 rounded-xl border-2 border-dashed py-12 text-center">
              <p className="text-muted-foreground">No cashiers added yet.</p>
            </div>
          ) : (
            <DataTable table={table} />
          )}
        </CardContent>
      </Card>

      <CashierModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedCashier(null);
          }
        }}
        cashier={selectedCashier}
        onSubmit={handleModalSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{cashierToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
