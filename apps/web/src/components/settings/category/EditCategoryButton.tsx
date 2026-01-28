"use client";

import { Button } from "@reelo/ui/components";
import { Edit } from "lucide-react";
import { useState } from "react";

import { EditCategoryModal } from "@/components/settings/category/EditCategoryModal";
import type { CategoryItem } from "@/hooks/category/useCategoriesQuery";

interface EditCategoryButtonProps {
  category: CategoryItem;
}

export function EditCategoryButton({ category }: EditCategoryButtonProps) {
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
      <EditCategoryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        category={category}
      />
    </>
  );
}
