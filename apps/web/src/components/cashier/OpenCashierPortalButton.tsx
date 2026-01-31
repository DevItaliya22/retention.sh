"use client";

import { Button } from "@reelo/ui/components";
import { ExternalLink } from "lucide-react";

import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { Cashier } from "@/hooks/cashier/useManageCashier";

interface OpenCashierPortalButtonProps {
  cashier: Cashier;
}

export function OpenCashierPortalButton({
  cashier,
}: OpenCashierPortalButtonProps) {
  const { data: businessData } = useCurrentBusiness();

  const handleOpenPortal = () => {
    if (!businessData?.business?.slug) {
      return;
    }
    window.open(
      `/cashier/${businessData.business.slug}/${cashier.cashierLinkSlug}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (!businessData?.business?.slug) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      icon={<ExternalLink className="h-4 w-4" />}
      onClick={handleOpenPortal}
      title="Open Cashier Portal"
    />
  );
}
