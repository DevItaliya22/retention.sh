import { withAdminAuth } from "@/lib/auth/middleware";
import { referralQuerySchema } from "@/lib/schemas/referral";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/** Resolve referredCustomerSlugId for phones in one query (businessId + phones). */
async function getSlugByPhone(
  businessId: string,
  phones: string[],
): Promise<Map<string, string>> {
  if (phones.length === 0) return new Map();
  const rows = await db.businessCustomer.findMany({
    where: {
      businessId,
      customer: {
        user: { phoneNumber: { in: phones } },
      },
    },
    select: {
      slugId: true,
      customer: {
        select: {
          user: { select: { phoneNumber: true } },
        },
      },
    },
  });
  const map = new Map<string, string>();
  for (const r of rows) {
    const phone = r.customer?.user?.phoneNumber;
    if (phone) map.set(phone, r.slugId);
  }
  return map;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    if (!context.business.referralEnabled) {
      return NextResponse.json(
        {
          items: [],
          total: 0,
          error: "Referral is not enabled. Enable it in Settings → General.",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = validateSchema(
      referralQuerySchema,
      Object.fromEntries(searchParams.entries()),
    );
    if (!validation.success) {
      return NextResponse.json(
        { items: [], total: 0, error: validation.error },
        { status: 400 },
      );
    }

    const { page = 1, perPage = 10, sort, referrerSlugId } = validation.data;
    const businessId = context.business.id;

    let referrerCustomerId: string | undefined;
    if (referrerSlugId) {
      const referrer = await db.businessCustomer.findFirst({
        where: { slugId: referrerSlugId, businessId },
        select: { customerId: true },
      });
      if (!referrer) {
        return NextResponse.json({ items: [], total: 0, page, perPage });
      }
      referrerCustomerId = referrer.customerId;
    }

    const where = {
      referrerBusinessId: businessId,
      ...(referrerCustomerId != null && { referrerCustomerId }),
    };
    const orderBy = parseOrderBy(sort);
    const skip = (page - 1) * perPage;

    const [rawItems, total] = await Promise.all([
      referrerSlugId
        ? db.referralLog.findMany({
            where,
            orderBy,
            skip,
            take: perPage,
            select: {
              id: true,
              newCustomerName: true,
              newCustomerPhone: true,
              becameCustomer: true,
            },
          })
        : db.referralLog.findMany({
            where,
            orderBy,
            skip,
            take: perPage,
            include: {
              referrer: {
                include: {
                  customer: {
                    include: {
                      user: { select: { name: true, phoneNumber: true } },
                    },
                  },
                },
              },
            },
          }),
      db.referralLog.count({ where }),
    ]);

    const phonesToResolve = [
      ...new Set(
        rawItems.filter((l) => l.becameCustomer).map((l) => l.newCustomerPhone),
      ),
    ];
    const slugByPhone = await getSlugByPhone(businessId, phonesToResolve);

    const items = rawItems.map((log) => {
      const referredCustomerSlugId = log.becameCustomer
        ? (slugByPhone.get(log.newCustomerPhone) ?? null)
        : null;
      if (referrerSlugId) {
        return {
          id: log.id,
          newCustomerName: log.newCustomerName,
          newCustomerPhone: log.newCustomerPhone,
          becameCustomer: log.becameCustomer,
          referredCustomerSlugId,
        };
      }
      return { ...log, referredCustomerSlugId };
    });

    return NextResponse.json({ items, total, page, perPage });
  } catch (error: unknown) {
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

function parseOrderBy(sort?: string): { createdAt: "asc" | "desc" } {
  if (!sort) return { createdAt: "desc" };
  const [field, dir] = sort.split(":");
  if (field === "createdAt" && (dir === "asc" || dir === "desc")) {
    return { createdAt: dir };
  }
  return { createdAt: "desc" };
}
