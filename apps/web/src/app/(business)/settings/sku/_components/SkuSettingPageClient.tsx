"use client";

import {
  PageLayout,
  ScaffoldContainer,
  ScaffoldSection,
} from "@/components/layouts";
import { AddSkuModal } from "@/components/settings/sku/AddSkuModal";
import { SkuImportSheet } from "@/components/settings/sku/SkuImportSheet";
import { SkuTable } from "@/components/settings/sku/SkuTable";
import { useSkusQuery } from "@/hooks/sku/useSkusQuery";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { FileUp, Layers, Package, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function SkuContent() {
  const { data, isLoading, isError, error } = useSkusQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load SKUs
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <SkuTable
      skus={data?.items ?? []}
      total={data?.total ?? 0}
      perPage={data?.perPage ?? 10}
      isLoading={isLoading}
    />
  );
}

export function SkuSettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname === "/settings/sku" ? "sku" : "categories";

  return (
    <PageLayout
      title="SKU"
      subtitle="Manage SKUs"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        activeTab === "sku" ? (
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
              onClick={() => setIsAddModalOpen(true)}
            >
              Add SKU
            </Button>
          </div>
        ) : undefined
      }
    >
      <ScaffoldContainer className="px-6">
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

            <TabsContent value="sku" className="mt-6">
              <div className="flex flex-col gap-4">
                <Suspense
                  fallback={
                    <SkuTable
                      skus={[]}
                      total={0}
                      perPage={10}
                      isLoading={true}
                    />
                  }
                >
                  <SkuContent />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>
        </ScaffoldSection>
      </ScaffoldContainer>
      <AddSkuModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <SkuImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </PageLayout>
  );
}
