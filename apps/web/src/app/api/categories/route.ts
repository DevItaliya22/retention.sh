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

    const { page = 1, perPage = 10, sort, name } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: {
      businessId: string;
      name?: { contains: string; mode: "insensitive" };
    } = {
      businessId: context.business.id,
    };

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }

    let orderBy: Array<Record<string, "asc" | "desc">> = [];
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";
      if (field === "name" || field === "sortOrder" || field === "createdAt") {
        orderBy = [{ [field]: sortDirection }];
      } else {
        orderBy = [{ sortOrder: "asc" }, { createdAt: "desc" }];
      }
    } else {
      orderBy = [{ sortOrder: "asc" }, { createdAt: "desc" }];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: { select: { skus: true } },
        },
      }),
      prisma.category.count({ where }),
    ]);

    const items = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      skuCount: c._count.skus,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
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

    const { name, description, sortOrder } = validation.data;

    const created = await prisma.category.create({
      data: {
        businessId: context.business.id,
        name,
        description: description ?? null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({
      item: {
        id: created.id,
        name: created.name,
        description: created.description,
        sortOrder: created.sortOrder,
        skuCount: 0,
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
