import { withAdminAuth } from "@/lib/auth/middleware";
import { validateSchema } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const storeIdParamSchema = z.object({
  id: z.string().uuid("Invalid store ID"),
});

const updateStoreBodySchema = z.object({
  returnWindowDays: z.coerce.number().int().min(1).max(365),
});

/**
 * PATCH /api/shopify/stores/[id]
 * Update store settings (e.g. return window for loyalty lock).
 */
export const PATCH = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    const paramValidation = validateSchema(storeIdParamSchema, params);
    if (!paramValidation.success) {
      return NextResponse.json(
        { error: paramValidation.error },
        { status: 400 },
      );
    }
    const { id } = paramValidation.data;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const bodyValidation = updateStoreBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error.flatten() },
        { status: 400 },
      );
    }

    const store = await db.shopifyStore.findFirst({
      where: { id, businessId: context.business.id },
    });
    if (!store) {
      return NextResponse.json(
        { error: "Store not found or access denied" },
        { status: 404 },
      );
    }

    await db.shopifyStore.update({
      where: { id: store.id },
      data: { returnWindowDays: bodyValidation.data.returnWindowDays },
    });
    return NextResponse.json({ success: true });
  },
);

/**
 * DELETE /api/shopify/stores/[id]
 * Disconnect a Shopify store (delete ShopifyStore and its product sync mappings).
 */
export const DELETE = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    const validation = validateSchema(storeIdParamSchema, params);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { id } = validation.data;

    const store = await db.shopifyStore.findFirst({
      where: {
        id,
        businessId: context.business.id,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or access denied" },
        { status: 404 },
      );
    }

    await db.shopifyStore.delete({ where: { id: store.id } });
    return NextResponse.json({ success: true });
  },
);
