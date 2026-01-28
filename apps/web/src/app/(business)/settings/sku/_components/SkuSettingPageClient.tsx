"use client";

import { ScaffoldContainer, ScaffoldSection } from "@/components/layouts";
import { AddSkuModal } from "@/components/settings/sku/AddSkuModal";
import { SkuTable } from "@/components/settings/sku/SkuTable";
import { useSkusQuery } from "@/hooks/sku/useSkusQuery";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { Layers, Package, Plus } from "lucide-react";
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
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname === "/settings/sku" ? "sku" : "categories";

  return (
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
            {activeTab === "sku" && (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add SKU
              </Button>
            )}
          </div>

          <TabsContent value="sku" className="mt-6">
            <div className="flex flex-col gap-4">
              <Suspense
                fallback={
                  <SkuTable skus={[]} total={0} perPage={10} isLoading={true} />
                }
              >
                <SkuContent />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </ScaffoldSection>
      <AddSkuModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </ScaffoldContainer>
  );
}
