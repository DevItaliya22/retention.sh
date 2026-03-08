import { withAdminAuth } from "@/lib/auth/middleware";
import { buildBillInvoice } from "@/lib/invoice/build-bill-invoice";
import {
  billInvoiceParamSchema,
  billInvoiceSchema,
} from "@/lib/schemas/invoice";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(billInvoiceParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, invoice: null },
          { status: 400 },
        );
      }

      const bill = await db.bill.findFirst({
        where: {
          id: validation.data.id,
          businessId: context.business.id,
        },
        include: {
          businessCustomer: {
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
          lineItems: {
            include: {
              sku: {
                select: {
                  sku: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          transactions: {
            select: {
              type: true,
              amount: true,
              valueKind: true,
            },
          },
        },
      });

      if (!bill) {
        return NextResponse.json(
          { error: "Bill not found", invoice: null },
          { status: 404 },
        );
      }

      const business = await db.business.findUnique({
        where: { id: context.business.id },
        select: {
          id: true,
          name: true,
          slug: true,
          defaultCurrencySymbol: true,
          defaultCurrencyCode: true,
        },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Business not found", invoice: null },
          { status: 404 },
        );
      }

      const invoice = buildBillInvoice({ bill, business });
      const invoiceValidation = validateSchema(billInvoiceSchema, invoice);

      if (!invoiceValidation.success) {
        return NextResponse.json(
          {
            error: `Invalid invoice payload: ${invoiceValidation.error}`,
            invoice: null,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ invoice: invoiceValidation.data });
    } catch (error: unknown) {
      console.error("Failed to fetch bill invoice:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch invoice. Please try again.",
          invoice: null,
        },
        { status: 500 },
      );
    }
  },
);
