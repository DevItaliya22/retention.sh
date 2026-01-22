"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Form,
} from "@reelo/ui/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { CashierInfoFields } from "./CashierInfoFields";
import {
  addCashierSchema,
  updateCashierSchema,
} from "@/lib/schemas/business-settings";
import { Cashier } from "@/lib/swr/use-cashiers";

interface CashierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier?: Cashier | null;
  onSubmit: (values: any) => Promise<void>;
  isLoading?: boolean;
}

export function CashierModal({
  open,
  onOpenChange,
  cashier,
  onSubmit,
  isLoading = false,
}: CashierModalProps) {
  const isEdit = !!cashier;
  const schema = isEdit ? updateCashierSchema : addCashierSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cashierName: "",
      cashierEmail: "",
      cashierLinkSlug: "",
      cashierPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (cashier) {
        form.reset({
          id: cashier.id,
          cashierName: cashier.name,
          cashierEmail: cashier.email,
          cashierLinkSlug: cashier.linkSlug,
        } as any);
      } else {
        form.reset({
          cashierName: "",
          cashierEmail: "",
          cashierLinkSlug: "",
          cashierPassword: "",
        });
      }
    }
  }, [open, cashier, form]);

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Cashier" : "Add Cashier"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update cashier information. Password changes are restricted for security."
              : "Add a new cashier to your business."}
          </DialogDescription>
        </DialogHeader>
        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-6 py-4">
            <CashierInfoFields
              control={form.control}
              includePassword={!isEdit}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {isEdit ? "Update" : "Add"} Cashier
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
