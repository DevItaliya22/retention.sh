import { withAdminAuth } from "@/lib/auth/middleware";
import { skusQuerySchema } from "@/lib/schemas/sku";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(skusQuerySchema, queryParams);
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
      sku,
      categoryId,
      isActive,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: {
      businessId: string;
      name?: { contains: string; mode: "insensitive" };
      sku?: { contains: string; mode: "insensitive" };
      categoryId?: string | null;
      isActive?: boolean;
    } = {
      businessId: context.business.id,
    };

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (sku) {
      where.sku = { contains: sku, mode: "insensitive" };
    }
    if (categoryId !== undefined) {
      where.categoryId = categoryId || null;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const orderBy: Record<string, unknown> = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";
      if (
        field === "name" ||
        field === "sku" ||
        field === "price" ||
        field === "createdAt" ||
        field === "isActive"
      ) {
        orderBy[field] = sortDirection;
      } else {
        orderBy.createdAt = "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [skus, total] = await Promise.all([
      db.sku.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      db.sku.count({ where }),
    ]);

    const items = skus.map((s) => ({
      id: s.id,
      sku: s.sku,
      name: s.name,
      description: s.description,
      price: s.price,
      unit: s.unit,
      categoryId: s.categoryId,
      categoryName: s.category?.name ?? null,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch SKUs:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch SKUs. Please try again.",
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

    const { createSkuSchema } = await import("@/lib/schemas/sku");
    const validation = validateSchema(createSkuSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, item: null },
        { status: 400 },
      );
    }

    const {
      sku: skuCode,
      name,
      description,
      price,
      unit,
      categoryId,
      isActive,
    } = validation.data;

    const existing = await db.sku.findFirst({
      where: {
        businessId: context.business.id,
        sku: skuCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "SKU code already exists for this business", item: null },
        { status: 400 },
      );
    }

    if (categoryId) {
      const category = await db.category.findFirst({
        where: {
          id: categoryId,
          businessId: context.business.id,
        },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found", item: null },
          { status: 400 },
        );
      }
    }

    const created = await db.sku.create({
      data: {
        businessId: context.business.id,
        sku: skuCode,
        name,
        description: description ?? null,
        price: price ?? null,
        unit: unit ?? null,
        categoryId: categoryId ?? null,
        isActive: isActive ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      item: {
        id: created.id,
        sku: created.sku,
        name: created.name,
        description: created.description,
        price: created.price,
        unit: created.unit,
        categoryId: created.categoryId,
        categoryName: created.category?.name ?? null,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to create SKU:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create SKU. Please try again.",
        item: null,
      },
      { status: 500 },
    );
  }
});
