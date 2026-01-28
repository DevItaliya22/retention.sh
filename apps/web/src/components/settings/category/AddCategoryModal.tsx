"use client";

import { useManageCategory } from "@/hooks/category/useManageCategory";
import { createCategorySchema } from "@/lib/schemas/sku";
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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AddCategoryFormValues = z.input<typeof createCategorySchema>;

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCategoryModal({ isOpen, onClose }: AddCategoryModalProps) {
  const { create } = useManageCategory();

  const form = useForm<AddCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: 0,
    },
  });

  const handleSubmit = (data: AddCategoryFormValues) => {
    create.mutate(
      {
        ...data,
        description: data.description || null,
        sortOrder: data.sortOrder ?? 0,
      },
      {
        onSuccess: (res) => {
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("Category created successfully");
          form.reset();
          onClose();
        },
        onError: (err) => {
          toast.error(
            getErrorMessageFromResponse(
              err,
              "Failed to create category. Please try again.",
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
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your SKUs (e.g. Beverages, Apparel).
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
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
