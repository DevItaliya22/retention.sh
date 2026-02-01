import { withAdminAuth } from "@/lib/auth/middleware";
import { updateSkuSchema } from "@/lib/schemas/sku";
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

      const existing = await db.sku.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "SKU not found", item: null },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(updateSkuSchema, body);
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

      if (skuCode && skuCode !== existing.sku) {
        const duplicate = await db.sku.findFirst({
          where: {
            businessId: context.business.id,
            sku: skuCode,
          },
        });
        if (duplicate) {
          return NextResponse.json(
            { error: "SKU code already exists for this business", item: null },
            { status: 400 },
          );
        }
      }

      if (categoryId !== undefined && categoryId !== null) {
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

      const updated = await db.sku.update({
        where: { id },
        data: {
          ...(skuCode !== undefined && { sku: skuCode }),
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(unit !== undefined && { unit }),
          ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        item: {
          id: updated.id,
          sku: updated.sku,
          name: updated.name,
          description: updated.description,
          price: updated.price,
          unit: updated.unit,
          categoryId: updated.categoryId,
          categoryName: updated.category?.name ?? null,
          isActive: updated.isActive,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (error: unknown) {
      console.error("Failed to update SKU:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to update SKU. Please try again.",
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

      const existing = await db.sku.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "SKU not found", success: false },
          { status: 404 },
        );
      }

      await db.sku.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Failed to delete SKU:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to delete SKU. Please try again.",
          success: false,
        },
        { status: 500 },
      );
    }
  },
);
