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

import { useManageCategory } from "@/hooks/category/useManageCategory";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  skuCount: number;
  subcategoryCount?: number;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  skuCount,
  subcategoryCount = 0,
}: DeleteCategoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { delete: deleteCategory } = useManageCategory();

  const handleDelete = () => {
    setIsOpen(false);
    toast.promise(deleteCategory.mutateAsync(categoryId), {
      loading: "Deleting category...",
      success: "Category deleted successfully",
      error: (err) => err.message || "Failed to delete category",
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryName}&quot;?
              {subcategoryCount > 0 && (
                <span className="mt-1 block">
                  This will also delete {subcategoryCount} subcategory
                  {subcategoryCount === 1 ? "" : "ies"} and uncategorize their
                  SKUs.
                </span>
              )}
              {skuCount > 0 && (
                <span className="mt-1 block">
                  {skuCount} SKU(s) in this category will be uncategorized.
                </span>
              )}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
