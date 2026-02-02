import type { CategoryItem } from "@/hooks/category/useCategoriesQuery";

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
}

/**
 * Build a tree from flat category list (supports unlimited nesting).
 */
export function buildCategoryTree(items: CategoryItem[]): CategoryTreeNode[] {
  const byParent = new Map<string | null, CategoryItem[]>();
  for (const c of items) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  function sortSiblings(cats: CategoryItem[]) {
    return [...cats].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  function toNode(c: CategoryItem): CategoryTreeNode {
    const children = sortSiblings(byParent.get(c.id) ?? []).map(toNode);
    return { ...c, children };
  }

  const roots = sortSiblings(byParent.get(null) ?? []);
  return roots.map(toNode);
}

/**
 * Get all descendant category IDs for a given category (to prevent moving into self/descendants).
 */
export function getDescendantIds(
  items: CategoryItem[],
  categoryId: string,
): string[] {
  const byParent = new Map<string | null, CategoryItem[]>();
  for (const c of items) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  const out: string[] = [];
  function collect(id: string) {
    const children = byParent.get(id) ?? [];
    for (const child of children) {
      out.push(child.id);
      collect(child.id);
    }
  }
  collect(categoryId);
  return out;
}

/**
 * Next display order for a category at a given level.
 * Top-level: parentId = null → max(sortOrder of root categories) + 1.
 * Under a parent: max(sortOrder of siblings under that parent) + 1.
 */
export function getNextSortOrder(
  items: CategoryItem[],
  parentId: string | null,
): number {
  const siblings = items.filter(
    (c) => (c.parentId ?? null) === (parentId ?? null),
  );
  if (siblings.length === 0) return 1;
  const maxOrder = Math.max(...siblings.map((c) => c.sortOrder));
  return maxOrder + 1;
}

/**
 * Flat list of categories with depth (0 = root) for parent selector UI.
 */
export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

export function getCategoryOptionsWithDepth(
  items: CategoryItem[],
  excludeIds: string[] = [],
): CategoryOption[] {
  const tree = buildCategoryTree(items);
  const excludeSet = new Set(excludeIds);
  const options: CategoryOption[] = [];

  function walk(nodes: CategoryTreeNode[], depth: number) {
    for (const node of nodes) {
      if (excludeSet.has(node.id)) continue;
      options.push({ id: node.id, name: node.name, depth });
      walk(node.children, depth + 1);
    }
  }
  walk(tree, 0);
  return options;
}
