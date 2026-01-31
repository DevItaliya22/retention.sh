"use client";

import { useCategoriesListQuery } from "@/hooks/category/useCategoriesListQuery";
import { buildCategoryTree } from "@/lib/category-tree";
import type { CategoryTreeNode } from "@/lib/category-tree";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from "@reelo/ui/components";
import { ChevronRight, FolderOpen, Folder, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteCategoryButton } from "./DeleteCategoryButton";
import { EditCategoryButton } from "./EditCategoryButton";

interface CategoryTreeProps {
  onAddSubcategory: (parentId: string | null) => void;
}

function CategoryRow({
  node,
  depth,
  onAddSubcategory,
}: {
  node: CategoryTreeNode;
  depth: number;
  onAddSubcategory: (parentId: string | null) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(true);
  const indent = depth * 20;

  const rowContent = (
    <>
      <div className="flex w-5 shrink-0 items-center justify-center">
        {hasChildren ? (
          <ChevronRight
            className="h-4 w-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? "rotate(90deg)" : undefined }}
          />
        ) : (
          <span className="w-4" aria-hidden />
        )}
      </div>
      {hasChildren ? (
        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5" title="Display order">
          #{node.sortOrder}
        </span>
        <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5">
          {node.skuCount} SKU{node.skuCount !== 1 ? "s" : ""}
        </span>
        {node.subcategoryCount > 0 && (
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5">
            {node.subcategoryCount} sub
          </span>
        )}
      </span>
      <div
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 [.group:focus-within_&]:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          icon={<Plus className="h-4 w-4" />}
          onClick={(e) => {
            e.stopPropagation();
            onAddSubcategory(node.id);
          }}
          title="Add subcategory"
        />
        <EditCategoryButton category={node} />
        <DeleteCategoryButton
          categoryId={node.id}
          categoryName={node.name}
          skuCount={node.skuCount}
          subcategoryCount={node.subcategoryCount}
        />
      </div>
    </>
  );

  if (!hasChildren) {
    return (
      <div
        className="group flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/60"
        style={{ paddingLeft: 12 + indent }}
      >
        {rowContent}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group">
        <CollapsibleTrigger asChild>
          <div
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/60"
            style={{ paddingLeft: 12 + indent }}
          >
            {rowContent}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-l border-muted/60 pl-0">
            {node.children.map((child) => (
              <CategoryRow
                key={child.id}
                node={child}
                depth={depth + 1}
                onAddSubcategory={onAddSubcategory}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function CategoryTree({ onAddSubcategory }: CategoryTreeProps) {
  const { data, isLoading, isError } = useCategoriesListQuery();
  const items = data?.items ?? [];
  const tree = useMemo(() => buildCategoryTree(items), [items]);

  if (isLoading && items.length === 0) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Category hierarchy
          </CardTitle>
          <CardDescription className="text-xs">
            Expand and manage your categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-6 py-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Category hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Failed to load categories</p>
        </CardContent>
      </Card>
    );
  }

  if (tree.length === 0) {
    return (
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">
            Category hierarchy
          </CardTitle>
          <CardDescription className="text-xs">
            Add categories to organize your SKUs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Folder className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 font-medium text-muted-foreground">
            No categories yet
          </p>
          <p className="text-sm text-muted-foreground">
            Use &quot;Add Category&quot; above to create your first category
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Category hierarchy
        </CardTitle>
        <CardDescription className="text-xs">
          Expand, reorder, and manage categories. Add subcategories from any
          row.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-2">
        <div className="divide-y divide-border/60">
          {tree.map((node) => (
            <CategoryRow
              key={node.id}
              node={node}
              depth={0}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
