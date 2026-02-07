import { withAdminAuth } from "@/lib/auth/middleware";
import { customerSlugIdParamSchema } from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/customers/[slugId]
 *
 * Route segment is [slugId] (not [id]) to avoid confusion with Customer.id or
 * BusinessCustomer composite id (businessId + customerId). The param value is
 * BusinessCustomer.slugId – a short uuid used in URLs and APIs. Scoped by
 * admin.business.id.
 */
export const GET = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(customerSlugIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, customer: null },
          { status: 400 },
        );
      }

      const { slugId } = validation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: {
          slugId,
          businessId: context.business.id,
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phoneNumber: true,
                },
              },
            },
          },
          referredBy: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          referrals: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          referralLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              newCustomerName: true,
              newCustomerPhone: true,
              becameCustomer: true,
              createdAt: true,
            },
          },
          bills: {
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
              lineItems: {
                include: {
                  sku: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      price: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", customer: null },
          { status: 404 },
        );
      }

      const customer = {
        id: businessCustomer.slugId,
        slugId: businessCustomer.slugId,
        customerId: businessCustomer.customer.id,
        name: businessCustomer.customer.user.name,
        email: businessCustomer.customer.email,
        phone: businessCustomer.customer.user.phoneNumber,
        pointsBalance: businessCustomer.pointsBalance,
        createdAt: businessCustomer.createdAt.toISOString(),
        updatedAt: businessCustomer.updatedAt.toISOString(),
        businessSlug: context.business.slug,
        referralSlug: businessCustomer.referralSlug,
        isServiceEnabled: context.business.isServiceEnabled,
        referredBy: businessCustomer.referredBy
          ? {
              name: businessCustomer.referredBy.customer.user.name,
              slugId: businessCustomer.referredBy.slugId,
            }
          : null,
        referrals: businessCustomer.referrals.map((r) => ({
          name: r.customer.user.name,
          slugId: r.slugId,
        })),
        referralLogs: businessCustomer.referralLogs.map((log) => ({
          id: log.id,
          newCustomerName: log.newCustomerName,
          newCustomerPhone: log.newCustomerPhone,
          becameCustomer: log.becameCustomer,
          createdAt: log.createdAt.toISOString(),
        })),
        bills: businessCustomer.bills.map((b) => ({
          id: b.id,
          billNumber: b.billNumber,
          amount: b.amount,
          lineItems: b.lineItems.map((li) => ({
            id: li.id,
            skuId: li.skuId,
            qty: li.qty,
            unitPrice: li.unitPrice,
            sku: {
              id: li.sku.id,
              sku: li.sku.sku,
              name: li.sku.name,
              price: li.sku.price,
              unit: li.sku.unit,
            },
          })),
          createdAt: b.createdAt.toISOString(),
        })),
      };

      return NextResponse.json({ customer });
    } catch (error: unknown) {
      console.error("Failed to fetch customer:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch customer. Please try again.",
          customer: null,
        },
        { status: 500 },
      );
    }
  },
);
