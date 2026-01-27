import { withAdminAuth } from "@/lib/auth/middleware";
import { customersQuerySchema } from "@/lib/schemas/customer";
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

    const validation = validateSchema(customersQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      name,
      email,
      phone,
      dateFrom,
      dateTo,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: any = {
      businessId: context.business.id,
    };

    if (name || email || phone) {
      const customerFilters: any = {};
      const userFilters: any = {};

      if (name) {
        userFilters.name = {
          contains: name,
          mode: "insensitive",
        };
      }

      if (phone) {
        userFilters.phoneNumber = {
          contains: phone,
          mode: "insensitive",
        };
      }

      if (Object.keys(userFilters).length > 0) {
        customerFilters.user = userFilters;
      }

      if (email) {
        customerFilters.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (Object.keys(customerFilters).length > 0) {
        where.customer = customerFilters;
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";

      if (field === "name") {
        orderBy.customer = {
          user: {
            name: sortDirection,
          },
        };
      } else if (field === "email") {
        orderBy.customer = {
          email: sortDirection,
        };
      } else if (field === "createdAt") {
        orderBy.createdAt = sortDirection;
      } else {
        orderBy.createdAt = "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [businessCustomers, total] = await Promise.all([
      prisma.businessCustomer.findMany({
        where,
        skip,
        take,
        orderBy,
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
        },
      }),
      prisma.businessCustomer.count({ where }),
    ]);

    const formattedCustomers = businessCustomers.map((bc) => ({
      id: bc.slugId,
      slugId: bc.slugId,
      customerId: bc.customer.id,
      name: bc.customer.user.name,
      email: bc.customer.email,
      phone: bc.customer.user.phoneNumber,
      pointsBalance: bc.pointsBalance,
      createdAt: bc.createdAt.toISOString(),
      updatedAt: bc.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      items: formattedCustomers,
      total,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch customers. Please try again.",
        items: [],
        total: 0,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
