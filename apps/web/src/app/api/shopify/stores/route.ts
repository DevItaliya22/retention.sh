import { withAdminAuth } from "@/lib/auth/middleware";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

/**
 * GET /api/shopify/stores
 * List connected Shopify stores for the current business.
 */
export const GET = withAdminAuth(async (_request, context) => {
  try {
    const stores = await db.shopifyStore.findMany({
      where: { businessId: context.business.id, isActive: true },
      select: {
        id: true,
        shopDomain: true,
        shopName: true,
        returnWindowDays: true,
        lastSyncedAt: true,
        createdAt: true,
        _count: { select: { productSyncs: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items: stores });
  } catch (error) {
    console.error("Failed to list Shopify stores:", error);
    return NextResponse.json(
      { error: "Failed to load connected stores", items: [] },
      { status: 500 },
    );
  }
});
