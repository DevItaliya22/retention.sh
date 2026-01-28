"use client";

import { Button } from "@reelo/ui/components";
import { Edit } from "lucide-react";
import { useState } from "react";

import type { SkuItem } from "@/hooks/sku/useSkusQuery";
import { EditSkuModal } from "./EditSkuModal";

interface EditSkuButtonProps {
  sku: SkuItem;
}

export function EditSkuButton({ sku }: EditSkuButtonProps) {
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
      <EditSkuModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        sku={sku}
      />
    </>
  );
}
