"use client";

import { Button } from "@reelo/ui/components";
import { Edit } from "lucide-react";
import { useState } from "react";

import { EditCashierModal } from "@/components/settings/cashier/EditCashierModal";
import type { Cashier } from "@/hooks/cashier/useManageCashier";

interface EditCashierButtonProps {
  cashier: Cashier;
}

export function EditCashierButton({ cashier }: EditCashierButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        icon={<Edit className="h-4 w-4" />}
        onClick={() => setIsOpen(true)}
      />
      <EditCashierModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        cashier={cashier}
      />
    </>
  );
}
