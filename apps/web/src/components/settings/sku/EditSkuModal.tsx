"use client";

import { useCategoriesListQuery } from "@/hooks/category/useCategoriesListQuery";
import { useManageSku } from "@/hooks/sku/useManageSku";
import type { SkuItem } from "@/hooks/sku/useSkusQuery";
import { updateSkuSchema } from "@/lib/schemas/sku";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@reelo/ui/components";
import { DialogSection } from "@reelo/ui/components";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type EditSkuFormValues = z.input<typeof updateSkuSchema>;

interface EditSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: SkuItem;
}

export function EditSkuModal({ isOpen, onClose, sku }: EditSkuModalProps) {
  const { update } = useManageSku();
  const { data: categoriesData } = useCategoriesListQuery();
  const categories = categoriesData?.items ?? [];

  const form = useForm<EditSkuFormValues>({
    resolver: zodResolver(updateSkuSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      price: undefined,
      unit: "",
      categoryId: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        sku: sku.sku,
        name: sku.name,
        description: sku.description ?? "",
        price: sku.price ?? undefined,
        unit: sku.unit ?? "",
        categoryId: sku.categoryId ?? null,
        isActive: sku.isActive,
      });
    }
  }, [isOpen, sku.id, form]);

  const handleSubmit = (data: EditSkuFormValues) => {
    update.mutate(
      {
        id: sku.id,
        data: {
          ...data,
          description: data.description || null,
          price: data.price ?? null,
          unit: data.unit || null,
          categoryId: data.categoryId ?? null,
        },
      },
      {
        onSuccess: (res) => {
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("SKU updated successfully");
          onClose();
        },
        onError: (err) => {
          toast.error(
            getErrorMessageFromResponse(
              err,
              "Failed to update SKU. Please try again.",
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
          <DialogTitle>Edit SKU</DialogTitle>
          <DialogDescription>
            Update SKU details for &quot;{sku.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogSection padding="medium" className="space-y-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. COKE-330" {...field} />
                    </FormControl>
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
                      <Input placeholder="Product name" {...field} />
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? undefined : Number(v));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. piece, kg"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (optional)</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? null : v)
                      }
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.parentName
                              ? `${c.parentName} › ${c.name}`
                              : c.name}
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
