import { withAdminAuth } from "@/lib/auth/middleware";
import { loyaltyStatsQuerySchema } from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  db,
  Prisma,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface LoyaltyStatRow {
  id: string;
  type: string;
  source: string;
  valueKind: string;
  amount: number;
  createdAt: string;
  customerSlugId: string;
  customerName: string;
  customerPhone: string | null;
  billId: string | null;
  billNumber: string | null;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    if (!isServiceEnabled(context.business.isServiceEnabled, "loyalty")) {
      return NextResponse.json(
        {
          error: "Loyalty is not enabled. Enable it in Settings → General.",
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(loyaltyStatsQuerySchema, queryParams);
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

    const {
      page = 1,
      perPage = 10,
      sort,
      type,
      source,
      valueKind,
      customerName,
      billNumber,
      dateFrom,
      dateTo,
    } = validation.data;

    const businessId = context.business.id;
    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: Prisma.TransactionWhereInput = { businessId };

    if (type) where.type = type as TransactionType;
    if (source) where.source = source as TransactionSource;
    if (valueKind) where.valueKind = valueKind as TransactionValueKind;
    if (billNumber) {
      const matchingBills = await db.bill.findMany({
        where: {
          businessId,
          billNumber: { contains: billNumber, mode: "insensitive" },
        },
        select: { id: true },
      });
      const ids = matchingBills.map((b) => b.id);
      if (ids.length === 0) {
        return NextResponse.json({
          items: [],
          total: 0,
          page,
          perPage,
        });
      }
      where.billId = { in: ids };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (customerName) {
      where.businessCustomer = {
        customer: {
          user: {
            name: { contains: customerName, mode: "insensitive" },
          },
        },
      };
    }

    const orderBy: Prisma.TransactionOrderByWithRelationInput = sort
      ? (() => {
          const [field, direction] = sort.split(":");
          const dir = direction === "desc" ? "desc" : "asc";
          if (field === "createdAt") return { createdAt: dir };
          if (field === "amount") return { amount: dir };
          return { createdAt: "desc" };
        })()
      : { createdAt: "desc" };

    const transactions = await db.transaction.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        businessCustomer: {
          include: {
            customer: {
              include: {
                user: {
                  select: { name: true, phoneNumber: true },
                },
              },
            },
          },
        },
        bill: {
          select: { id: true, billNumber: true },
        },
      },
    });

    const total = await db.transaction.count({ where });

    // For rows without bill relation (legacy sourceId-only), fetch bill numbers by sourceId
    const legacySourceIds = [
      ...new Set(
        (
          transactions as {
            source: string;
            sourceId: string | null;
            bill?: { id: string } | null;
          }[]
        )
          .filter((t) => t.source === "BILL" && t.sourceId && !t.bill)
          .map((t) => t.sourceId as string),
      ),
    ];
    const legacyBills =
      legacySourceIds.length > 0
        ? await db.bill.findMany({
            where: { id: { in: legacySourceIds }, businessId },
            select: { id: true, billNumber: true },
          })
        : [];
    const billById = new Map(legacyBills.map((b) => [b.id, b]));

    type TxWithCustomer = (typeof transactions)[number] & {
      businessCustomer: {
        slugId: string;
        customer: {
          user: { name: string | null; phoneNumber: string | null } | null;
        } | null;
      } | null;
      bill?: { id: string; billNumber: string } | null;
      billId?: string | null;
    };
    const items: LoyaltyStatRow[] = (transactions as TxWithCustomer[]).map(
      (t) => {
        const bc = t.businessCustomer;
        const bill = t.bill ?? (t.sourceId ? billById.get(t.sourceId) : null);
        const billId = t.billId ?? t.sourceId ?? null;
        return {
          id: t.id,
          type: t.type,
          source: t.source,
          valueKind: t.valueKind,
          amount: t.amount,
          createdAt: t.createdAt.toISOString(),
          customerSlugId: bc?.slugId ?? "",
          customerName: bc?.customer?.user?.name ?? "—",
          customerPhone: bc?.customer?.user?.phoneNumber ?? null,
          billId,
          billNumber: bill?.billNumber ?? null,
        };
      },
    );

    return NextResponse.json({
      items,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch loyalty stats:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch loyalty stats. Try again.",
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
