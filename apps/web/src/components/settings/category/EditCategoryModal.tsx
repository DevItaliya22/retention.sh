"use client";

import { useManageCategory } from "@/hooks/category/useManageCategory";
import type { CategoryItem } from "@/hooks/category/useCategoriesQuery";
import { updateCategorySchema } from "@/lib/schemas/sku";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reelo/ui/components";
import { DialogSection } from "@reelo/ui/components";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type EditCategoryFormValues = z.input<typeof updateCategorySchema>;

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryItem;
}

export function EditCategoryModal({
  isOpen,
  onClose,
  category,
}: EditCategoryModalProps) {
  const { update } = useManageCategory();

  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
        sortOrder: category.sortOrder,
      });
    }
  }, [isOpen, category.id, form]);

  const handleSubmit = (data: EditCategoryFormValues) => {
    update.mutate(
      {
        id: category.id,
        data: {
          ...data,
          description: data.description || null,
        },
      },
      {
        onSuccess: (res) => {
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("Category updated successfully");
          onClose();
        },
        onError: (err) => {
          toast.error(
            getErrorMessageFromResponse(
              err,
              "Failed to update category. Please try again.",
            ),
          );
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update category &quot;{category.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogSection padding="medium" className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Beverages" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
