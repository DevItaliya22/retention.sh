import { withCashierAuth } from "@/lib/auth/middleware";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cashierSkusQuerySchema = z.object({
  perPage: z.coerce.number().int().min(1).max(500).default(500).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "false" ? false : true)),
});

/**
 * GET /api/cashier/sku
 * List SKUs for the cashier's business (for line item picker in bill creation).
 */
export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(cashierSkusQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0 },
        { status: 400 },
      );
    }

    const { perPage = 500, isActive = true } = validation.data;

    const skus = await prisma.sku.findMany({
      where: {
        businessId: context.business.id,
        isActive,
      },
      orderBy: { name: "asc" },
      take: perPage,
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        unit: true,
      },
    });

    const items = skus.map((s) => ({
      id: s.id,
      sku: s.sku,
      name: s.name,
      price: s.price,
      unit: s.unit,
    }));

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch SKUs for cashier:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch SKUs. Please try again.",
        items: [],
        total: 0,
      },
      { status: 500 },
    );
  }
});
