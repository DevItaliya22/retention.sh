import { withAdminAuth } from "@/lib/auth/middleware";
import { skuImportSchema } from "@/lib/schemas/sku";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(skuImportSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, created: 0, failed: 0, errors: [] },
        { status: 400 },
      );
    }

    const { items } = validation.data;
    const businessId = context.business.id;

    let created = 0;
    const errors: { row: number; sku: string; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const rowNum = i + 1;

      try {
        const existing = await db.sku.findFirst({
          where: {
            businessId,
            sku: item.sku,
          },
        });

        if (existing) {
          errors.push({
            row: rowNum,
            sku: item.sku,
            message: "SKU code already exists",
          });
          continue;
        }

        if (item.categoryId) {
          const category = await db.category.findFirst({
            where: {
              id: item.categoryId,
              businessId,
            },
          });
          if (!category) {
            errors.push({
              row: rowNum,
              sku: item.sku,
              message: "Category not found",
            });
            continue;
          }
        }

        await db.sku.create({
          data: {
            businessId,
            sku: item.sku,
            name: item.name,
            description: item.description ?? null,
            price: item.price ?? null,
            unit: item.unit ?? null,
            categoryId: item.categoryId ?? null,
            isActive: item.isActive ?? true,
          },
        });
        created++;
      } catch (err) {
        errors.push({
          row: rowNum,
          sku: item.sku,
          message: sanitizeErrorMessage(err) ?? "Failed to create SKU",
        });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: unknown) {
    console.error("Failed to import SKUs:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ??
          "Failed to import SKUs. Please try again.",
        created: 0,
        failed: 0,
        errors: [],
      },
      { status: 500 },
    );
  }
});
