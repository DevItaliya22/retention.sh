import type { GooeyTabItem } from "@/components/layouts";
import { BarChart3, Layers, Package } from "lucide-react";

export const SKU_TABS: GooeyTabItem[] = [
  {
    value: "sku",
    label: (
      <>
        <Package className="h-4 w-4" />
        <span>SKU</span>
      </>
    ),
    path: "/settings/sku",
  },
  {
    value: "analytics",
    label: (
      <>
        <BarChart3 className="h-4 w-4" />
        <span>Analytics</span>
      </>
    ),
    path: "/settings/sku/analytics",
  },
  {
    value: "categories",
    label: (
      <>
        <Layers className="h-4 w-4" />
        <span>Categories</span>
      </>
    ),
    path: "/settings/sku/categories",
  },
];
