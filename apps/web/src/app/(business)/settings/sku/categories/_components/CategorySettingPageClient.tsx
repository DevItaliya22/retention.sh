"use client";

import { DashboardPageShell, ScaffoldSection } from "@/components/layouts";
import { AddCategoryModal } from "@/components/settings/category/AddCategoryModal";
import { CategoryImportSheet } from "@/components/settings/category/CategoryImportSheet";
import { CategoryTable } from "@/components/settings/category/CategoryTable";
import { useCategoriesQuery } from "@/hooks/category/useCategoriesQuery";

import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { FileUp, Layers, Package, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function CategorySettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading } = useCategoriesQuery();
  const activeTab = pathname === "/settings/sku" ? "sku" : "categories";
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
        <Tabs value={activeTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="space-x-1 p-1">
              <TabsTrigger
                value="sku"
                className="gap-2"
                onClick={() => router.push("/settings/sku")}
              >
                <Package className="h-4 w-4" />
                <span>SKU</span>
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="gap-2"
                onClick={() => router.push("/settings/sku/categories")}
              >
                <Layers className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categories" className="mt-4">
            <CategoryTable
              categories={categories}
              total={total}
              perPage={perPage}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
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
