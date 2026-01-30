import { withAdminAuth } from "@/lib/auth/middleware";
import { referralQuerySchema } from "@/lib/schemas/referral";
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

    const validation = validateSchema(referralQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { items: [], total: 0, error: validation.error },
        { status: 400 },
      );
    }

    const { page = 1, perPage = 10, sort } = validation.data;
    const businessId = context.business.id;

    // Build where clause
    const where = {
      referrerBusinessId: businessId,
    };

    // Build orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sort) {
      const [field, direction] = sort.split(":");
      if (field && direction) {
        orderBy = { [field]: direction };
      }
    }

    // Execute queries
    const [items, total] = await Promise.all([
      prisma.referralLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          referrer: {
            include: {
              customer: {
                include: {
                  user: {
                    select: {
                      name: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.referralLog.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error("Failed to fetch referral logs:", error);
    return NextResponse.json(
      {
        items: [],
        total: 0,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch referral logs. Please try again.",
      },
      { status: 500 },
    );
  }
});
