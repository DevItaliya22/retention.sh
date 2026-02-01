import { withAdminAuth } from "@/lib/auth/middleware";
import { updateCategorySchema } from "@/lib/schemas/sku";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = await params;

      const existing = await db.category.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Category not found", item: null },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(updateCategorySchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, item: null },
          { status: 400 },
        );
      }

      const { name, description, sortOrder, parentId } = validation.data;

      if (parentId !== undefined && parentId === id) {
        return NextResponse.json(
          { error: "Category cannot be its own parent", item: null },
          { status: 400 },
        );
      }

      const updated = await db.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(parentId !== undefined && { parentId: parentId ?? null }),
        },
        include: {
          _count: { select: { skus: true } },
        },
      });

      let parentName: string | null = null;
      if (updated.parentId) {
        const parent = await db.category.findUnique({
          where: { id: updated.parentId },
          select: { name: true },
        });
        parentName = parent?.name ?? null;
      }
      const subcategoryCount = await db.category.count({
        where: { parentId: id },
      });

      return NextResponse.json({
        item: {
          id: updated.id,
          parentId: updated.parentId,
          parentName,
          name: updated.name,
          description: updated.description,
          sortOrder: updated.sortOrder,
          skuCount: updated._count.skus,
          subcategoryCount,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (error: unknown) {
      console.error("Failed to update category:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to update category. Please try again.",
          item: null,
        },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = await params;

      const existing = await db.category.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Category not found", success: false },
          { status: 404 },
        );
      }

      await db.category.update({
        where: { id },
        data: { skus: { set: [] } },
      });
      await db.category.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Failed to delete category:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to delete category. Please try again.",
          success: false,
        },
        { status: 500 },
      );
    }
  },
);
