"use client";

import { useCategoriesListQuery } from "@/hooks/category/useCategoriesListQuery";
import type { CategoryItem } from "@/hooks/category/useCategoriesQuery";
import { useManageCategory } from "@/hooks/category/useManageCategory";
import { updateCategorySchema } from "@/lib/schemas/sku";
import {
  getCategoryOptionsWithDepth,
  getDescendantIds,
  getNextSortOrder,
} from "@/lib/utils/category-tree";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reelo/ui/components";
import { useEffect, useMemo } from "react";
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
  const { data: categoriesData } = useCategoriesListQuery();
  const items = categoriesData?.items ?? [];
  const excludeIds = useMemo(
    () => [category.id, ...getDescendantIds(items, category.id)],
    [items, category.id],
  );
  const parentOptions = getCategoryOptionsWithDepth(items, excludeIds);

  const form = useForm<EditCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
      parentId: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
        sortOrder: category.sortOrder,
        parentId: category.parentId ?? null,
      });
    }
  }, [
    isOpen,
    category.id,
    category.name,
    category.description,
    category.sortOrder,
    category.parentId,
    form,
  ]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const data = form.getValues();
    return new Promise<void>((resolve, reject) => {
      update.mutate(
        {
          id: category.id,
          data: {
            ...data,
            description: data.description || null,
            parentId: data.parentId ?? null,
          },
        },
        {
          onSuccess: (res) => {
            if (res.error) {
              toast.error(res.error);
              reject(new Error(res.error));
              return;
            }
            toast.success("Category updated successfully");
            onClose();
            resolve();
          },
          onError: (err) => {
            toast.error(
              getErrorMessageFromResponse(
                err,
                "Failed to update category. Please try again.",
              ),
            );
            reject(err);
          },
        },
      );
    });
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
          >
            <DialogSection padding="medium" className="space-y-4">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent category (optional)</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        const parentId = v === "__none__" ? null : v;
                        field.onChange(parentId);
                        form.setValue(
                          "sortOrder",
                          getNextSortOrder(items, parentId),
                        );
                      }}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Top-level category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          None (top-level)
                        </SelectItem>
                        {parentOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span
                              style={{
                                marginLeft: opt.depth * 16,
                                display: "inline-block",
                              }}
                            >
                              {opt.depth > 0 ? "↳ " : ""}
                              {opt.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <SaveButton
                onSave={runSubmit}
                labels={{
                  idle: "Save changes",
                  loading: "Saving",
                  success: "Saved",
                }}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
