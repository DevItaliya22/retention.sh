"use client";

import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { AddCategoryModal } from "@/components/settings/category/AddCategoryModal";
import { CategoryImportSheet } from "@/components/settings/category/CategoryImportSheet";
import { CategoryTable } from "@/components/settings/category/CategoryTable";
import { useCategoriesQuery } from "@/hooks/category/useCategoriesQuery";
import { Button } from "@reelo/ui/components";
import { FileUp, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { SKU_TABS } from "../../_components/sku-tabs-config";

export function CategorySettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading } = useCategoriesQuery();
  const activeTab =
    pathname === "/settings/sku"
      ? "sku"
      : pathname === "/settings/sku/analytics"
        ? "analytics"
        : "categories";
  const categories = data?.items ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;

  const openAddCategory = (parentId: string | null = null) => {
    setAddModalParentId(parentId);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddModalParentId(null);
  };

  return (
    <DashboardPageShell
      title="Category"
      subtitle="Manage product categories"
      primaryActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<FileUp className="h-4 w-4" />}
            onClick={() => setIsImportSheetOpen(true)}
          >
            Import
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => openAddCategory(null)}
          >
            Add category
          </Button>
        </div>
      }
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="sku-gooey"
          tabs={SKU_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          <CategoryTable
            categories={categories}
            total={total}
            perPage={perPage}
            isLoading={isLoading}
          />
        </GooeyTabs>
      </ScaffoldSection>
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        defaultParentId={addModalParentId}
      />
      <CategoryImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </DashboardPageShell>
  );
}
