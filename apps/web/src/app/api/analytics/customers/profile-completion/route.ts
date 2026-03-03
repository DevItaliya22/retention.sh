import { withAdminAuth } from "@/lib/auth/middleware";
import type { ProfileCompletionResponse } from "@/lib/types/analytics";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const customers = await db.businessCustomer.findMany({
      where: { businessId },
      select: {
        customer: {
          select: {
            email: true,
            user: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    const total = customers.length;
    let complete = 0;

    for (const bc of customers) {
      const hasName = !!bc.customer?.user?.name;
      const hasPhone = !!bc.customer?.user?.phoneNumber;
      const hasEmail = !!bc.customer?.email;
      if (hasName && hasPhone && hasEmail) {
        complete++;
      }
    }

    const incomplete = total - complete;
    const percentage =
      total > 0 ? Math.round((complete / total) * 10000) / 100 : 0;

    const response: ProfileCompletionResponse = {
      complete,
      incomplete,
      percentage,
      total,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch profile completion:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch profile completion data.",
        complete: 0,
        incomplete: 0,
        percentage: 0,
        total: 0,
      } satisfies ProfileCompletionResponse,
      { status: 500 },
    );
  }
});
