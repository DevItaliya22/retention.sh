"use client";

import { useState } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Form,
} from "@reelo/ui/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCashierSchema } from "@/lib/schemas/business-settings";
import { updateCashierSettings } from "@/lib/actions/business-settings";
import { toast } from "sonner";
import { z } from "zod";
import { CashierInfoFields } from "../../../shared/CashierInfoFields";

interface CashierSettingsStepProps {
  cashiers: any[];
}

export function CashierSettingsStep({ cashiers }: CashierSettingsStepProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Cashiers</CardTitle>
        <CardDescription>
          Manage your team members. Password changes are restricted here for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cashiers.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
              <p className="text-muted-foreground">No cashiers added yet.</p>
            </div>
          ) : (
            cashiers.map((cashier) => (
              <CashierEditForm key={cashier.id} cashier={cashier} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CashierEditForm({ cashier }: { cashier: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof updateCashierSchema>>({
    resolver: zodResolver(updateCashierSchema),
    defaultValues: {
      id: cashier.id,
      cashierName: cashier.name,
      cashierEmail: cashier.email,
      cashierLinkSlug: cashier.linkSlug,
    },
  });

  const onUpdate = async (values: z.infer<typeof updateCashierSchema>) => {
    setIsLoading(true);
    const result = await updateCashierSettings(values);
    setIsLoading(false);
    if (result.success) {
      toast.success(`Cashier ${values.cashierName} updated!`);
    } else {
      toast.error(result.error || "Failed to update cashier");
    }
  };

  return (
    <Form {...(form as any)}>
      <form onSubmit={form.handleSubmit(onUpdate)} className="p-6 border rounded-xl space-y-4 bg-muted/10 transition-colors hover:bg-muted/20">
        <CashierInfoFields control={form.control} compact />
        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" variant="secondary" loading={isLoading}>
            Update Cashier
          </Button>
        </div>
      </form>
    </Form>
  );
}
