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

import { useManageSku } from "@/hooks/sku/useManageSku";

interface DeleteSkuButtonProps {
  skuId: string;
  skuName: string;
}

export function DeleteSkuButton({ skuId, skuName }: DeleteSkuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { delete: deleteSku } = useManageSku();

  const handleDelete = () => {
    setIsOpen(false);
    toast.promise(deleteSku.mutateAsync(skuId), {
      loading: "Deleting SKU...",
      success: "SKU deleted successfully",
      error: (err) => err.message || "Failed to delete SKU",
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
            <AlertDialogTitle>Delete SKU</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{skuName}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSku.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSku.isPending}
            >
              {deleteSku.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
