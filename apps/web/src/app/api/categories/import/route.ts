import { withAdminAuth } from "@/lib/auth/middleware";
import { categoryImportSchema } from "@/lib/schemas/sku";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(categoryImportSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, created: 0, failed: 0, errors: [] },
        { status: 400 },
      );
    }

    const { items } = validation.data;
    const businessId = context.business.id;

    let created = 0;
    const errors: { row: number; name: string; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const rowNum = i + 1;

      try {
        // Check for duplicate name within the same parent (or root level)
        const existing = await db.category.findFirst({
          where: {
            businessId,
            name: item.name,
            parentId: item.parentId ?? null,
          },
        });

        if (existing) {
          errors.push({
            row: rowNum,
            name: item.name,
            message: "Category with this name already exists at this level",
          });
          continue;
        }

        // Validate parent category if provided
        if (item.parentId) {
          const parent = await db.category.findFirst({
            where: {
              id: item.parentId,
              businessId,
            },
          });
          if (!parent) {
            errors.push({
              row: rowNum,
              name: item.name,
              message: "Parent category not found",
            });
            continue;
          }
        }

        await db.category.create({
          data: {
            businessId,
            name: item.name,
            description: item.description ?? null,
            sortOrder: item.sortOrder ?? 0,
            parentId: item.parentId ?? null,
          },
        });
        created++;
      } catch (err) {
        errors.push({
          row: rowNum,
          name: item.name,
          message: sanitizeErrorMessage(err) ?? "Failed to create category",
        });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: unknown) {
    console.error("Failed to import categories:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ??
          "Failed to import categories. Please try again.",
        created: 0,
        failed: 0,
        errors: [],
      },
      { status: 500 },
    );
  }
});
