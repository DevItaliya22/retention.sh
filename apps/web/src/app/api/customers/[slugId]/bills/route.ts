import { withAdminAuth } from "@/lib/auth/middleware";
import {
  customerDetailQuerySchema,
  customerSlugIdParamSchema,
} from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(customerSlugIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: validation.error,
            items: [],
            total: 0,
            page: 1,
            perPage: 10,
          },
          { status: 400 },
        );
      }

      const queryValidation = validateSchema(
        customerDetailQuerySchema,
        Object.fromEntries(request.nextUrl.searchParams.entries()),
      );
      const query = queryValidation.success ? queryValidation.data : undefined;
      const page = query?.billsPage ?? 1;
      const perPage = query?.billsPerPage ?? 10;

      const { slugId } = validation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: { slugId, businessId: context.business.id },
        select: { customerId: true },
      });
      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", items: [], total: 0, page, perPage },
          { status: 404 },
        );
      }

      const skip = (page - 1) * perPage;

      const [bills, total] = await Promise.all([
        db.bill.findMany({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: perPage,
          select: {
            id: true,
            billNumber: true,
            finalAmount: true,
            userPaidAmount: true,
            cashbackAmount: true,
            cashbackRedeemedAmount: true,
            createdAt: true,
          },
        }),
        db.bill.count({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          },
        }),
      ]);

      const items = bills.map((b) => {
        const amountToShow = b.userPaidAmount ?? b.finalAmount ?? null;
        return {
          id: b.id,
          billNumber: b.billNumber,
          finalAmount: b.finalAmount,
          userPaidAmount: b.userPaidAmount,
          amount: amountToShow,
          cashbackAmount: b.cashbackAmount ?? null,
          cashbackRedeemedAmount: b.cashbackRedeemedAmount ?? null,
          createdAt: b.createdAt.toISOString(),
        };
      });

      return NextResponse.json({ items, total, page, perPage });
    } catch (error: unknown) {
      console.error("Failed to fetch customer bills:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch customer bills. Please try again.",
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 500 },
      );
    }
  },
);
