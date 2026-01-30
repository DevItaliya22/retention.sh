import { withAdminAuth } from "@/lib/auth/middleware";
import { categoriesQuerySchema, createCategorySchema } from "@/lib/schemas/sku";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(categoriesQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0, page: 1, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      name,
      parentId,
      all,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = all ? undefined : perPage;

    const where: {
      businessId: string;
      parentId?: string | null;
      name?: { contains: string; mode: "insensitive" };
    } = {
      businessId: context.business.id,
    };

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (parentId !== undefined) {
      where.parentId = parentId === null ? null : parentId;
    }

    let orderBy: Array<{
      sortOrder?: "asc" | "desc";
      createdAt?: "asc" | "desc";
      name?: "asc" | "desc";
    }>;
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = (direction === "desc" ? "desc" : "asc") as
        | "asc"
        | "desc";
      if (field === "name" || field === "sortOrder" || field === "createdAt") {
        orderBy = [{ [field]: sortDirection }];
      } else {
        orderBy = [{ sortOrder: "asc" }, { createdAt: "desc" }];
      }
    } else {
      orderBy = [{ sortOrder: "asc" }, { createdAt: "desc" }];
    }

    const allCategories = await prisma.category.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { skus: true } },
      },
    });

    const parentIds = [
      ...new Set(
        allCategories
          .map((c) => c.parentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const parentNames = new Map<string, string>();
    if (parentIds.length > 0) {
      const parents = await prisma.category.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true },
      });
      for (const p of parents) parentNames.set(p.id, p.name);
    }

    const byParent = new Map<string | null, (typeof allCategories)[number][]>();
    for (const c of allCategories) {
      const key = c.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }

    type Cat = (typeof allCategories)[number];
    function toItem(c: Cat) {
      return {
        id: c.id,
        parentId: c.parentId,
        parentName: c.parentId ? (parentNames.get(c.parentId) ?? null) : null,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        skuCount: c._count.skus,
        subcategoryCount: (byParent.get(c.id) ?? []).length,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    }

    let items: ReturnType<typeof toItem>[];
    let total: number;
    const returnPage = all ? 1 : page;
    const returnPerPage = all ? allCategories.length : perPage;

    if (!sort) {
      const topLevel = (byParent.get(null) ?? []).sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const ordered: Cat[] = [];
      function appendWithChildren(parentList: Cat[]) {
        for (const p of parentList) {
          ordered.push(p);
          const children = (byParent.get(p.id) ?? []).sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.createdAt.getTime() - b.createdAt.getTime(),
          );
          appendWithChildren(children);
        }
      }
      appendWithChildren(topLevel);
      total = ordered.length;
      items = all
        ? ordered.map(toItem)
        : ordered.slice(skip, skip + (take ?? perPage)).map(toItem);
    } else {
      total = allCategories.length;
      items = all
        ? allCategories.map(toItem)
        : allCategories.slice(skip, skip + (take ?? perPage)).map(toItem);
    }

    return NextResponse.json({
      items,
      total,
      page: returnPage,
      perPage: returnPerPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch categories. Please try again.",
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(createCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, item: null },
        { status: 400 },
      );
    }

    const { name, description, sortOrder, parentId } = validation.data;

    const created = await prisma.category.create({
      data: {
        businessId: context.business.id,
        name,
        description: description ?? null,
        sortOrder: sortOrder ?? 0,
        parentId: parentId ?? null,
      },
    });

    return NextResponse.json({
      item: {
        id: created.id,
        parentId: created.parentId,
        parentName: null,
        name: created.name,
        description: created.description,
        sortOrder: created.sortOrder,
        skuCount: 0,
        subcategoryCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create category. Please try again.",
        item: null,
      },
      { status: 500 },
    );
  }
});
