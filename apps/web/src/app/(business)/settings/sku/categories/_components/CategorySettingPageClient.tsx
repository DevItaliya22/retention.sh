"use client";

import {
  PageLayout,
  ScaffoldContainer,
  ScaffoldSection,
} from "@/components/layouts";
import { AddCategoryModal } from "@/components/settings/category/AddCategoryModal";
import { CategoryImportSheet } from "@/components/settings/category/CategoryImportSheet";
import { CategoryTree } from "@/components/settings/category/CategoryTree";

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
  const activeTab = pathname === "/settings/sku" ? "sku" : "categories";

  const openAddCategory = (parentId: string | null = null) => {
    setAddModalParentId(parentId);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddModalParentId(null);
  };

  return (
    <PageLayout
      title="Category"
      subtitle="Manage product categories"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        activeTab === "categories" ? (
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
        ) : undefined
      }
    >
      <ScaffoldContainer size="full">
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

            <TabsContent value="categories" className="mt-6">
              <CategoryTree onAddSubcategory={openAddCategory} />
            </TabsContent>
          </Tabs>
        </ScaffoldSection>
      </ScaffoldContainer>
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        defaultParentId={addModalParentId}
      />
      <CategoryImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </PageLayout>
  );
}
