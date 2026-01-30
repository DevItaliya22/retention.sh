"use client";

import { ScaffoldContainer, ScaffoldSection } from "@/components/layouts";
import { AddCategoryModal } from "@/components/settings/category/AddCategoryModal";
import { CategoryTree } from "@/components/settings/category/CategoryTree";

import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { Layers, Package, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function CategorySettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    <ScaffoldContainer size="full">
      <ScaffoldSection isFullWidth className="pt-0!">
        <Tabs value={activeTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg border bg-muted/30 p-1">
              <TabsTrigger
                value="sku"
                className="gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                onClick={() => router.push("/settings/sku")}
              >
                <Package className="h-4 w-4" />
                <span>SKU</span>
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                onClick={() => router.push("/settings/sku/categories")}
              >
                <Layers className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
            </TabsList>
            {activeTab === "categories" && (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => openAddCategory(null)}
              >
                Add category
              </Button>
            )}
          </div>

          <TabsContent value="categories" className="mt-6">
            <CategoryTree onAddSubcategory={openAddCategory} />
          </TabsContent>
        </Tabs>
      </ScaffoldSection>
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        defaultParentId={addModalParentId}
      />
    </ScaffoldContainer>
  );
}
